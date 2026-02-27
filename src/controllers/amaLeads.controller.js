const { crmDb } = require("../config/crmFirebase");

exports.fetchAmaLeadsTest = async (req, res) => {
  try {
    let { name, limit = 20, cursorId } = req.query;

    limit = Number(limit);

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    let query = crmDb
      .collection("ama_leads")
      .where("assigned_to", "==", name) // DB-level filter
      .orderBy("synced_at", "desc")
      .orderBy("__name__") // order by docId (required for cursor)
      .limit(limit);

    // Firestore-native pagination using last docId
    if (cursorId) {
      const lastDocSnap = await crmDb
        .collection("ama_leads")
        .doc(cursorId)
        .get();

      if (lastDocSnap.exists) {
        query = query.startAfter(lastDocSnap);
      }
    }

    const snapshot = await query.get();

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    return res.json({
      totalFetched: snapshot.size,
      matchedCount: data.length,
      data,
      nextCursorId: lastDoc ? lastDoc.id : null,
      hasMore: snapshot.docs.length === limit,
      message: "Firestore-native pagination using docId cursor",
    });
  } catch (err) {
    console.error("AMA Leads Test Error:", err);
    return res.status(500).json({ message: "Error fetching leads" });
  }
};
