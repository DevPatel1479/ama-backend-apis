// team.controller.js
const { amaDb } = require("../config/amaFirebase");

// exports.getTeamMembers = async (req, res) => {
//   try {
//     let { page = 1, limit = 10 } = req.query;
//     page = parseInt(page);
//     limit = parseInt(limit);

//     const skip = (page - 1) * limit;

//     const usersRef = amaDb.collection("users");

//     // Sort by "sort" field (ascending)
//     const querySnapshot = await usersRef
//       .orderBy("sort")
//       .offset(skip)
//       .limit(limit)
//       .get();

//     const results = [];
//     querySnapshot.forEach((doc) => {
//       const data = doc.data();
//       results.push({
//         id: doc.id,
//         image: data.image || "",
//         name: data.name || "",
//         position: data.position || "",
//       });
//     });

//     // Get total count for pagination
//     const totalSnapshot = await usersRef.get();
//     const total = totalSnapshot.size;
//     const totalPages = Math.ceil(total / limit);

//     return res.status(200).json({
//       success: true,
//       page,
//       limit,
//       total,
//       totalPages,
//       data: results,
//     });
//   } catch (error) {
//     console.error("🔥 Error fetching team members:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Server error while fetching team data",
//     });
//   }
// };

const ROLE_PRIORITY = ["lawyer", "tech", "business_development"];

exports.getTeamMembers = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;
    const usersRef = amaDb.collection("users");

    let mergedResults = [];

    // 🔥 Role-wise sorted fetch
    for (const role of ROLE_PRIORITY) {
      const snapshot = await usersRef
        .where("role", "==", role)
        .orderBy("sort", "asc")
        .get();

      snapshot.forEach((doc) => {
        const data = doc.data();
        mergedResults.push({
          id: doc.id,
          image: data.image || "",
          name: data.name || "",
          position: data.position || "",
        });
      });
    }

    // 🔁 Pagination AFTER merge
    const total = mergedResults.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedData = mergedResults.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      data: paginatedData,
    });
  } catch (error) {
    console.error("🔥 Error fetching team members:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching team data",
    });
  }
};
