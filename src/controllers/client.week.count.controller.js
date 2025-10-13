// controllers/clientWeekCountController.js
const { db } = require("../config/firebase");

exports.getWeeklyClientCount = async (req, res) => {
  try {
    const { week } = req.body;
    if (!week) {
      return res.status(400).json({ error: "Week name is required" });
    }

    const weekOrder = {
      first_week: 1,
      second_week: 2,
      third_week: 3,
      fourth_week: 4,
    };
    const targetWeek = weekOrder[week];
    if (!targetWeek) {
      return res.status(400).json({ error: "Invalid week name" });
    }

    // Get all client docs (ID starts with "client_")
    const snapshot = await db.collection("login_users").get();

    let totalCount = 0;

    snapshot.forEach((doc) => {
      const docId = doc.id;
      if (!docId.startsWith("client_")) return; // skip non-clients

      const data = doc.data();
      const startDateStr = data.start_date;
      if (!startDateStr) return;

      const startDate = new Date(startDateStr);
      const dayOfMonth = startDate.getDate();

      // Determine which week of the month it falls into
      const weekNum =
        dayOfMonth <= 7 ? 1 : dayOfMonth <= 14 ? 2 : dayOfMonth <= 21 ? 3 : 4;

      if (weekNum === targetWeek) totalCount++;
    });

    return res.status(200).json({
      success: true,
      week,
      total_clients: totalCount,
    });
  } catch (error) {
    console.error("Error fetching weekly client count:", error);
    return res.status(500).json({ error: error.message });
  }
};
