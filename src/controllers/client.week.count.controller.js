// controllers/clientWeekCountController.js
const { db } = require("../config/firebase");

exports.getWeeklyClientCount = async (req, res) => {
  try {
    // Fetch all client documents once
    const snapshot = await db
      .collection("login_users")
      .where("role", "==", "client")
      .get();

    // Filter only client documents
    const clientDocs = snapshot.docs;

    // Function to count clients for a given week number
    const countForWeek = (weekNum) => {
      return clientDocs.reduce((count, doc) => {
        const startDateStr = doc.data().start_date;
        if (!startDateStr) return count;

        const dayOfMonth = new Date(startDateStr).getDate();
        const docWeekNum =
          dayOfMonth <= 7 ? 1 : dayOfMonth <= 14 ? 2 : dayOfMonth <= 21 ? 3 : 4;

        return docWeekNum === weekNum ? count + 1 : count;
      }, 0);
    };

    // Run all weeks in parallel
    const [first, second, third, fourth] = await Promise.all([
      countForWeek(1),
      countForWeek(2),
      countForWeek(3),
      countForWeek(4),
    ]);

    return res.status(200).json({
      success: true,
      total_clients_by_week: {
        first_week: first,
        second_week: second,
        third_week: third,
        fourth_week: fourth,
      },
    });
  } catch (error) {
    console.error("Error fetching weekly client count:", error);
    return res.status(500).json({ error: error.message });
  }
};
