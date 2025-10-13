// controllers/assignWeekTopicController.js
const { db } = require("../config/firebase");

exports.assignWeekTopicToClients = async (req, res) => {
  try {
    const snapshot = await db.collection("login_users").get();

    let updateCount = 0;

    const batch = db.batch();

    snapshot.forEach((doc) => {
      const docId = doc.id;
      if (!docId.startsWith("client_")) return; // only clients

      const data = doc.data();
      const startDateStr = data.start_date;
      if (!startDateStr) return;

      const startDate = new Date(startDateStr);
      const day = startDate.getDate();

      let week_topic = "";
      if (day <= 7) week_topic = "first_week";
      else if (day <= 14) week_topic = "second_week";
      else if (day <= 21) week_topic = "third_week";
      else week_topic = "fourth_week";

      const ref = db.collection("login_users").doc(doc.id);
      batch.update(ref, { week_topic });

      updateCount++;
    });

    // Commit all updates in batch
    await batch.commit();

    return res.status(200).json({
      success: true,
      message: "Week topic assigned successfully to clients",
      total_updated: updateCount,
    });
  } catch (error) {
    console.error("Error assigning week topics:", error);
    return res.status(500).json({ error: error.message });
  }
};
