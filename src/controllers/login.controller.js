const { db } = require("../config/firebase");

exports.loginUser = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const snapshot = await db
      .collection("login_users")
      .where("phone", "==", phone)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res
        .status(404)
        .json({ error: "User with this phone number not found" });
    }
    const weekOrder = {
      1: "first_week",
      2: "second_week",
      3: "third_week",
      4: "fourth_week",
    };
    const userDoc = snapshot.docs[0];
    const data = userDoc.data();
    const startDateStr = data.start_date;
    if (!startDateStr) return;
    const startDate = new Date(startDateStr);
    const dayOfMonth = startDate.getDate();

    // Determine which week of the month it falls into
    const weekNum =
      dayOfMonth <= 7 ? 1 : dayOfMonth <= 14 ? 2 : dayOfMonth <= 21 ? 3 : 4;

    const weekTopic = weekOrder[weekNum];
    const role = data.role || "unknown";
    const name = data.name || "N/A";
    const email = data.email || "N/A";

    const week_topic = data.week_topic || "";
    const finalData = {
      role: role,
      name: name,
      email: email,
      week_topic: weekTopic,
    };
    return res.status(200).json(finalData);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
