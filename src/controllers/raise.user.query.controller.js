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
// GET /get-queries
// Accepts: role, phone, limit, lastSubmittedAt (cursor for pagination)
exports.getQueries = async (req, res) => {
  try {
    const { role, phone, limit = 10, lastSubmittedAt } = req.query;
    const limitInt = parseInt(limit, 10);

    let queryRef;

    // 🔹 Case 1: Fetch specific user's queries (existing behavior)
    if (role && phone) {
      const docId = `${role}_${phone}`;
      queryRef = db
        .collection("queries")
        .doc(docId)
        .collection("userQueries")
        .orderBy("submitted_at", "desc")
        .limit(limitInt);

      if (lastSubmittedAt) {
        queryRef = queryRef.startAfter(parseInt(lastSubmittedAt, 10));
      }
    }
    // 🔹 Case 2: Fetch ALL queries (new feature)
    else {
      queryRef = db
        .collectionGroup("userQueries")
        .orderBy("submitted_at", "desc")
        .limit(limitInt);

      if (lastSubmittedAt) {
        queryRef = queryRef.startAfter(parseInt(lastSubmittedAt, 10));
      }
    }

    const snapshot = await queryRef.get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        message: "No queries found.",
        queries: [],
        nextPageCursor: null,
      });
    }

    const queries = [];
    snapshot.forEach((doc) => {
      queries.push({
        id: doc.id,
        path: doc.ref.path, // to know which user it belongs to
        ...doc.data(),
      });
    });

    const lastQuery = queries[queries.length - 1];

    return res.status(200).json({
      success: true,
      message: "Queries fetched successfully.",
      queries,
      nextPageCursor: lastQuery.submitted_at, // pass this in next call
    });
  } catch (error) {
    console.error("Error in getQueries:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
