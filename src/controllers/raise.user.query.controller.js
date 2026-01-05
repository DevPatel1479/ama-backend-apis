const { db, admin } = require("../config/firebase");
const { crmDb } = require("../config/crmFirebase");
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

    // Document ID format for app_clients
    // const clientDocId = `ama_${role}_${phone}`;

    // Fetch alloc_adv and alloc_adv_secondary
    const clientsRef = crmDb.collection("clients");
    const clientQuery = await clientsRef
      .where("phone", "==", phone) // <-- Filter by phone
      .limit(1)
      .get();

    if (clientQuery.empty) {
      return res.status(404).json({
        success: false,
        message: `Client not found with phone: ${phone}`,
      });
    }

    const clientDoc = clientQuery.docs[0];
    const clientData = clientDoc.data();
    const { alloc_adv, alloc_adv_secondary } = clientData;

    // Now proceed with adding query
    const parentDocId = `91${phone}`;
    const timestamp = Math.floor(Date.now() / 1000); // unix timestamp

    const userDocRef = db.collection("queries").doc(parentDocId);
    const newQueryRef = userDocRef.collection("userQueries").doc(); // generate id

    // Build payload with helpful metadata + alloc_adv info
    const queryData = {
      queryId: newQueryRef.id, // generated id
      role,
      phone: `91${phone}`,
      parentDocId,
      query,
      posted_by: name,
      submitted_at: timestamp,
      status: "pending",
      alloc_adv: alloc_adv || null,
      alloc_adv_secondary: alloc_adv_secondary || null,
    };

    // Mirror doc in top-level 'allQueries' with same id
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
// exports.getQueries = async (req, res) => {
//   try {
//     const { role, phone, limit = 10, lastSubmittedAt } = req.query;
//     const limitInt = parseInt(limit, 10);

//     let queryRef;

//     // Case 1: specific user's queries (unchanged)
//     if (role && phone) {
//       const docId = `${role}_${phone}`;
//       queryRef = db
//         .collection("queries")
//         .doc(docId)
//         .collection("userQueries")
//         .orderBy("submitted_at", "desc")
//         .limit(limitInt);

//       if (lastSubmittedAt) {
//         queryRef = queryRef.startAfter(parseInt(lastSubmittedAt, 10));
//       }
//     }
//     // Case 2: global queries -> use top-level allQueries (no collectionGroup)
//     else {
//       queryRef = db
//         .collection("allQueries")
//         .orderBy("submitted_at", "desc")
//         .limit(limitInt);

//       if (lastSubmittedAt) {
//         queryRef = queryRef.startAfter(parseInt(lastSubmittedAt, 10));
//       }
//     }

//     const snapshot = await queryRef.get();

//     if (snapshot.empty) {
//       return res.status(200).json({
//         success: true,
//         message: "No queries found.",
//         queries: [],
//         nextPageCursor: null,
//       });
//     }

//     const queries = [];
//     snapshot.forEach((doc) => {
//       queries.push({
//         id: doc.id,
//         path: doc.ref.path,
//         ...doc.data(),
//       });
//     });

//     const lastQuery = queries[queries.length - 1];

//     return res.status(200).json({
//       success: true,
//       message: "Queries fetched successfully.",
//       queries,
//       nextPageCursor: lastQuery.submitted_at, // send timestamp as cursor
//     });
//   } catch (error) {
//     // Optional: detect Firestore index error and return friendly message
//     if (error && error.code === 9) {
//       console.error("Firestore index error in getQueries:", error);
//       return res.status(500).json({
//         success: false,
//         message:
//           "Firestore requires an index for this query. If you're using collectionGroup, create the required index or use the top-level 'allQueries' collection.",
//       });
//     }

//     console.error("Error in getQueries:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//     });
//   }
// };

// controllers/queries.controller.js (or wherever getQueries is)
exports.getQueries = async (req, res) => {
  try {
    const { role, phone, limit = 10, lastSubmittedAt, status } = req.query;
    const limitInt = Math.max(1, Math.min(100, parseInt(limit, 10) || 10)); // guard

    let queryRef;

    // Per-user userQueries subcollection
    if (role && phone) {
      const docId = `91${phone}`;
      queryRef = db.collection("queries").doc(docId).collection("userQueries");

      if (status) {
        queryRef = queryRef.where("status", "==", status);
      }

      queryRef = queryRef.orderBy("submitted_at", "desc").limit(limitInt);

      if (lastSubmittedAt) {
        // startAfter on timestamp number is ok if submitted_at is number
        queryRef = queryRef.startAfter(parseInt(lastSubmittedAt, 10));
      }
    } else {
      // Global queries
      queryRef = db.collection("allQueries");
      if (status) {
        queryRef = queryRef.where("status", "==", status);
      }

      queryRef = queryRef.orderBy("submitted_at", "desc").limit(limitInt);

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
      const data = doc.data();
      queries.push({
        id: doc.id,
        path: doc.ref.path,
        ...data,
      });
    });

    // send last doc's submitted_at as cursor (number)
    const lastDoc = queries[queries.length - 1];
    const nextPageCursor = lastDoc ? lastDoc.submitted_at || null : null;

    return res.status(200).json({
      success: true,
      message: "Queries fetched successfully.",
      queries,
      nextPageCursor,
    });
  } catch (error) {
    console.error("Error in getQueries:", error);
    // Firestore composite index note
    if (error && error.code && error.code === 9) {
      return res.status(500).json({
        success: false,
        message:
          "Firestore index required for this query (status + submitted_at). Create the composite index in Firebase console.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

exports.raiseQueryV2 = async (req, res) => {
  try {
    const { role, phone, query, name } = req.body;

    if (!role || !phone || !query) {
      return res.status(400).json({
        success: false,
        message: "role, phone, and query are required.",
      });
    }

    // Document ID format for app_clients
    // const clientDocId = `ama_${role}_${phone}`;

    // Fetch alloc_adv and alloc_adv_secondary
    const clientsRef = crmDb.collection("clients");
    const clientQuery = await clientsRef
      .where("phone", "==", phone) // <-- Filter by phone
      .limit(1)
      .get();

    if (clientQuery.empty) {
      return res.status(404).json({
        success: false,
        message: `Client not found with phone: ${phone}`,
      });
    }

    const clientDoc = clientQuery.docs[0];
    const clientData = clientDoc.data();
    const { alloc_adv, alloc_adv_secondary } = clientData;

    // Now proceed with adding query
    const parentDocId = `${phone}`;
    const timestamp = Math.floor(Date.now() / 1000); // unix timestamp

    const userDocRef = db.collection("queries").doc(parentDocId);
    const newQueryRef = userDocRef.collection("userQueries").doc(); // generate id

    // Build payload with helpful metadata + alloc_adv info
    const queryData = {
      queryId: newQueryRef.id, // generated id
      role,
      phone: `${phone}`,
      parentDocId,
      query,
      posted_by: name,
      submitted_at: timestamp,
      status: "pending",
      alloc_adv: alloc_adv || null,
      alloc_adv_secondary: alloc_adv_secondary || null,
    };

    // Mirror doc in top-level 'allQueries' with same id
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

exports.getQueriesV2 = async (req, res) => {
  try {
    const { role, phone, limit = 10, lastSubmittedAt, status } = req.query;
    const limitInt = Math.max(1, Math.min(100, parseInt(limit, 10) || 10)); // guard

    let queryRef;

    // Per-user userQueries subcollection
    if (role && phone) {
      const docId = `${phone}`;
      queryRef = db.collection("queries").doc(docId).collection("userQueries");

      if (status) {
        queryRef = queryRef.where("status", "==", status);
      }

      queryRef = queryRef.orderBy("submitted_at", "desc").limit(limitInt);

      if (lastSubmittedAt) {
        // startAfter on timestamp number is ok if submitted_at is number
        queryRef = queryRef.startAfter(parseInt(lastSubmittedAt, 10));
      }
    } else {
      // Global queries
      queryRef = db.collection("allQueries");
      if (status) {
        queryRef = queryRef.where("status", "==", status);
      }

      queryRef = queryRef.orderBy("submitted_at", "desc").limit(limitInt);

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
      const data = doc.data();
      queries.push({
        id: doc.id,
        path: doc.ref.path,
        ...data,
      });
    });

    // send last doc's submitted_at as cursor (number)
    const lastDoc = queries[queries.length - 1];
    const nextPageCursor = lastDoc ? lastDoc.submitted_at || null : null;

    return res.status(200).json({
      success: true,
      message: "Queries fetched successfully.",
      queries,
      nextPageCursor,
    });
  } catch (error) {
    console.error("Error in getQueries:", error);
    // Firestore composite index note
    if (error && error.code && error.code === 9) {
      return res.status(500).json({
        success: false,
        message:
          "Firestore index required for this query (status + submitted_at). Create the composite index in Firebase console.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
