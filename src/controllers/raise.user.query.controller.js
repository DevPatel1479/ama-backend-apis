const { db, admin } = require("../config/firebase");
const FieldValue = admin.firestore.FieldValue;

// POST /raise-query
exports.raiseQuery = async (req, res) => {
  try {
    const { role, phone, query } = req.body;

    if (!role || !phone || !query) {
      return res.status(400).json({
        success: false,
        message: "role, phone, and query are required.",
      });
    }

    const docId = `${role}_${phone}`;
    const timestamp = Math.floor(Date.now() / 1000); // unix timestamp

    const queryData = {
      query,
      submitted_at: timestamp,
      status: "pending",
    };

    const userDocRef = db.collection("queries").doc(docId);

    // Store each query in a subcollection for efficiency
    await userDocRef.collection("userQueries").add(queryData);

    return res.status(201).json({
      success: true,
      message: "Query submitted successfully.",
      data: queryData,
    });
  } catch (error) {
    console.error("Error in raiseQuery:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

// GET /get-queries with cursor-based pagination
// Accepts: role, phone, limit, lastDocId
exports.getQueries = async (req, res) => {
  try {
    const { role, phone, limit = 10, lastDocId } = req.query;

    if (!role || !phone) {
      return res.status(400).json({
        success: false,
        message: "role and phone are required.",
      });
    }

    const docId = `${role}_${phone}`;
    let queryRef = db
      .collection("queries")
      .doc(docId)
      .collection("userQueries")
      .orderBy("submitted_at", "desc")
      .limit(parseInt(limit, 10));

    // If lastDocId is provided, start after that document for pagination
    if (lastDocId) {
      const lastDocSnap = await db
        .collection("queries")
        .doc(docId)
        .collection("userQueries")
        .doc(lastDocId)
        .get();

      if (lastDocSnap.exists) {
        queryRef = queryRef.startAfter(lastDocSnap);
      }
    }

    const snapshot = await queryRef.get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "No queries found for this user.",
        queries: [],
      });
    }

    const queries = [];
    snapshot.forEach((doc) => {
      queries.push({ id: doc.id, ...doc.data() });
    });

    // Return last document id for next page
    const newLastDocId = queries[queries.length - 1].id;

    return res.status(200).json({
      success: true,
      message: "Queries fetched successfully.",
      queries,
      nextPageCursor: newLastDocId, // frontend can pass this for next page
    });
  } catch (error) {
    console.error("Error in getQueries:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
