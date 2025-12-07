// team.controller.js
const { amaDb } = require("../config/amaFirebase");

exports.getTeamMembers = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    const usersRef = amaDb.collection("users");

    // Sort by "sort" field (ascending)
    const querySnapshot = await usersRef
      .orderBy("sort")
      .offset(skip)
      .limit(limit)
      .get();

    const results = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        image: data.image || "",
        name: data.name || "",
        position: data.position || "",
      });
    });

    // Get total count for pagination
    const totalSnapshot = await usersRef.get();
    const total = totalSnapshot.size;
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      data: results,
    });
  } catch (error) {
    console.error("🔥 Error fetching team members:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching team data",
    });
  }
};
