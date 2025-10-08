const { db, admin } = require("../config/firebase");
const FieldValue = admin.firestore.FieldValue;

// POST /raise-query
exports.raiseQuery = async (req, res) => {
  try {
    const { role, phone, query, name } = req.body;

    if (!role || !phone || !query) {
      return res.status(400).json({
        success: false,
        message: "role, phone, and query are required.",
      });
    }

    const parentDocId = `${role}_${phone}`;
    const timestamp = Math.floor(Date.now() / 1000); // unix timestamp

    const userDocRef = db.collection("queries").doc(parentDocId);
    const newQueryRef = userDocRef.collection("userQueries").doc(); // generate id

    // Build payload with helpful metadata so allQueries is self-contained
    const queryData = {
      queryId: newQueryRef.id, // generated id
      role,
      phone,
      parentDocId, // helpful for tracing
      query,
      name,
      submitted_at: timestamp,
      status: "pending",
    };

    // Mirror doc in top-level 'allQueries' with same id (so it's easy to correlate)
    const allQueriesRef = db.collection("allQueries").doc(newQueryRef.id);

    // Use a batch to write both docs atomically
    const batch = db.batch();
    batch.set(newQueryRef, queryData); // subcollection doc
    batch.set(allQueriesRef, queryData); // top-level mirrored doc

    await batch.commit();

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

// GET /get-queries
// Accepts: role, phone, limit, lastSubmittedAt
exports.getQueries = async (req, res) => {
  try {
    const { role, phone, limit = 10, lastSubmittedAt } = req.query;
    const limitInt = parseInt(limit, 10);

    let queryRef;

    // Case 1: specific user's queries (unchanged)
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
    // Case 2: global queries -> use top-level allQueries (no collectionGroup)
    else {
      queryRef = db
        .collection("allQueries")
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
        path: doc.ref.path,
        ...doc.data(),
      });
    });

    const lastQuery = queries[queries.length - 1];

    return res.status(200).json({
      success: true,
      message: "Queries fetched successfully.",
      queries,
      nextPageCursor: lastQuery.submitted_at, // send timestamp as cursor
    });
  } catch (error) {
    // Optional: detect Firestore index error and return friendly message
    if (error && error.code === 9) {
      console.error("Firestore index error in getQueries:", error);
      return res.status(500).json({
        success: false,
        message:
          "Firestore requires an index for this query. If you're using collectionGroup, create the required index or use the top-level 'allQueries' collection.",
      });
    }

    console.error("Error in getQueries:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
