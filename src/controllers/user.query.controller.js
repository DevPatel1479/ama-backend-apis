const { db, admin } = require("../config/firebase");

exports.submitUserQuery = async (req, res) => {
  try {
    const { query, user_id, query_type, name } = req.body;
    console.log("calling this  ... ");
    if (!query || !user_id || !query_type || !name) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: query, user_id, or query_type",
      });
    }

    const parts = user_id.split("_");
    const baseUserId = parts.length === 3 ? `${parts[0]}_${parts[1]}` : user_id;

    // Get client data
    const clientDocId = `ama_${baseUserId}`;
    const clientDocRef = db.collection("app_clients").doc(clientDocId);
    const clientDocSnap = await clientDocRef.get();

    let advocatePhone = null;
    let allocatedAdvocate = null;

    if (clientDocSnap.exists) {
      const clientData = clientDocSnap.data();
      advocatePhone = clientData.advocate_phonenumber || null;
      allocatedAdvocate = clientData.alloc_adv || null;
    }

    // MAIN user_query document (client's perspective)
    const userQueryDocId =
      parts.length !== 3
        ? advocatePhone
          ? `${user_id}_${advocatePhone}`
          : user_id
        : user_id;

    const queryRef = db.collection("user_query").doc(userQueryDocId);

    const queryData = {
      query: query.trim(),
      query_type: query_type.trim(),
      status: "pending",
      submitted_at: Date.now(),
      advocate_phonenumber: advocatePhone,
      alloc_adv: allocatedAdvocate,
      client_name: name,
    };

    // Add query to client's user_query document
    await queryRef.set(
      {
        queries: admin.firestore.FieldValue.arrayUnion(queryData),
      },
      { merge: true }
    );

    // ✨ Now handle the ADVOCATE-side document update
    if (parts.length === 3 && advocatePhone) {
      const clientPhone = parts[1]; // Extract client phone number
      const advocateDocRef = db.collection("user_query").doc(advocatePhone);

      const advocateQueryData = {
        ...queryData,
        documentId: userQueryDocId,
        // client_phonenumber: clientPhone, // add client phone
      };

      await advocateDocRef.set(
        {
          queries: admin.firestore.FieldValue.arrayUnion(advocateQueryData),
        },
        { merge: true }
      );
    } else if (parts.length === 2 && advocatePhone) {
      const clientPhone = parts[1]; // Extract client phone number
      const advocateDocRef = db.collection("user_query").doc(advocatePhone);

      const advocateQueryData = {
        ...queryData,

        documentId: userQueryDocId,
      };

      await advocateDocRef.set(
        {
          queries: admin.firestore.FieldValue.arrayUnion(advocateQueryData),
        },
        { merge: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Query submitted and stored successfully.",
      documentId: userQueryDocId,
      data: queryData,
    });
  } catch (error) {
    console.error("Error submitting query:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

/// ======================= older getUserQuery logic ========================================
exports.getUserQuery = async (req, res) => {
  const { user_id, page = 1, limit = 10 } = req.body;

  try {
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: user_id",
      });
    }

    let queryDoc = null;
    let matchedDocId = user_id;

    // 👉 If user_id contains no underscores, treat it as phone number
    if (!user_id.includes("_")) {
      const docSnap = await db.collection("user_query").doc(user_id).get();
      if (docSnap.exists) {
        queryDoc = docSnap;
      }
    } else {
      // ✅ Check if user_id contains full doc ID (has 2 underscores)
      const isFullDocId = user_id.split("_").length === 3;

      if (isFullDocId) {
        // Direct fetch using full document ID
        const docSnap = await db.collection("user_query").doc(user_id).get();
        if (docSnap.exists) {
          queryDoc = docSnap;
        }
      }

      if (!queryDoc) {
        // Prefix search using range query on document ID
        const snapshot = await db
          .collection("user_query")
          .orderBy("__name__")
          .startAt(user_id + "_")
          .endAt(user_id + "_\uf8ff")
          .limit(1)
          .get();

        if (!snapshot.empty) {
          queryDoc = snapshot.docs[0];
          matchedDocId = queryDoc.id;
        }
      }
    }

    if (!queryDoc || !queryDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "No queries found for this user",
      });
    }

    const data = queryDoc.data();
    const allQueries = data.queries || [];

    // // Sort by latest first
    // allQueries.sort((a, b) => b.submitted_at - a.submitted_at);

    // const total = allQueries.length;
    // const startIndex = (page - 1) * limit;
    // const endIndex = page * limit;

    // // const paginatedQueries = allQueries.slice(startIndex, endIndex);
    // const paginatedQueries = allQueries
    //   .map((query, index) => ({ ...query, originalIndex: index })) // 👈 attach original index
    //   .sort((a, b) => b.submitted_at - a.submitted_at)
    //   .slice(startIndex, endIndex);

    // First attach original index BEFORE sorting
    const allQueriesWithIndex = allQueries.map((query, index) => ({
      ...query,
      originalIndex: index,
    }));

    // Then sort by submitted_at
    allQueriesWithIndex.sort((a, b) => b.submitted_at - a.submitted_at);

    const total = allQueriesWithIndex.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedQueries = allQueriesWithIndex.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      message: "User queries retrieved successfully",
      documentId: matchedDocId,
      page: Number(page),
      limit: Number(limit),
      total,
      hasMore: endIndex < total,
      queries: paginatedQueries,
    });
  } catch (error) {
    console.error("Error fetching user queries:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.getAdminUserQuery = async (req, res) => {
  const { user_id, page = 1, limit = 10 } = req.body;

  try {
    if (!user_id || !user_id.startsWith("admin_")) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing admin user_id",
      });
    }

    // 1️⃣ Verify admin in login_users
    const adminDocSnap = await db.collection("login_users").doc(user_id).get();
    if (!adminDocSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const adminData = adminDocSnap.data();
    if (adminData.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Not an admin.",
      });
    }

    // 2️⃣ Fetch ALL user_query docs where ID is only a phone number
    const snapshot = await db.collection("user_query").get();
    const phoneDocs = snapshot.docs.filter((doc) => {
      // keep only docs where ID looks like a phone number (digits only)
      return /^\d+$/.test(doc.id);
    });

    if (phoneDocs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No phone-based queries found",
      });
    }

    // 3️⃣ Combine queries from all matching docs
    let allQueries = [];
    phoneDocs.forEach((doc) => {
      const data = doc.data();
      (data.queries || []).forEach((query, index) => {
        allQueries.push({
          ...query,
          originalIndex: index,
          documentId: doc.id, // Keep track of which phone doc it came from
        });
      });
    });

    // Sort by submitted_at (latest first)
    allQueries.sort((a, b) => b.submitted_at - a.submitted_at);

    const total = allQueries.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedQueries = allQueries.slice(startIndex, endIndex);

    return res.status(200).json({
      success: true,
      message: "Admin user queries retrieved successfully",
      page: Number(page),
      limit: Number(limit),
      total,
      hasMore: endIndex < total,
      queries: paginatedQueries,
    });
  } catch (error) {
    console.error("Error fetching admin user queries:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.updateUserQueryStatus = async (req, res) => {
  const { phone, query_idx, remarks } = req.body;

  if (!phone || query_idx === undefined) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: phone and query_idx",
    });
  }

  try {
    const userQueryRef = db.collection("user_query");
    const advocateDocRef = userQueryRef.doc(phone);
    const advocateDocSnap = await advocateDocRef.get();

    if (!advocateDocSnap.exists) {
      return res.status(404).json({
        success: false,
        message: "No user_query document found for the provided phone number",
      });
    }

    const advocateData = advocateDocSnap.data();
    const queries = advocateData.queries || [];
    // console.log(`Advocate document data ${JSON.stringify(advocateData, null, 2)}`);
    if (query_idx < 0 || query_idx >= queries.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid query_idx",
      });
    }

    // Step 1: Update advocate's document
    queries[query_idx].status = "resolved";
    if (remarks) {
      queries[query_idx].remarks = remarks;
    }
    await advocateDocRef.update({ queries });

    // Step 2: Get linked documentId and update that as well
    const clientDocId = queries[query_idx].documentId;
    // console.log(`client document found ${clientDocId}`);
    if (clientDocId) {
      const clientDocRef = userQueryRef.doc(clientDocId);
      const clientDocSnap = await clientDocRef.get();

      if (clientDocSnap.exists) {
        const clientQueries = clientDocSnap.data().queries || [];

        if (query_idx >= 0 && query_idx < clientQueries.length) {
          clientQueries[query_idx].status = "resolved";
          if (remarks) {
            clientQueries[query_idx].remarks = remarks;
          }
          await clientDocRef.update({ queries: clientQueries });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Query status updated to resolved in both documents",
      updated_query: queries[query_idx],
    });
  } catch (error) {
    console.error("Error updating query status:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

exports.updateAdminUserQueryStatus = async (req, res) => {
  const { advocate_phone, query_idx, remarks } = req.body;

  if (!advocate_phone || query_idx === undefined) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: advocate_phone and query_idx",
    });
  }

  try {
    const userQueryRef = db.collection("user_query");

    // 1️⃣ Fetch advocate's document
    const advocateDocRef = userQueryRef.doc(advocate_phone);
    const advocateDocSnap = await advocateDocRef.get();

    if (!advocateDocSnap.exists) {
      return res.status(404).json({
        success: false,
        message:
          "No user_query document found for the provided advocate phone number",
      });
    }

    const advocateData = advocateDocSnap.data();
    const queries = advocateData.queries || [];

    if (query_idx < 0 || query_idx >= queries.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid query_idx",
      });
    }

    // 2️⃣ Update advocate's document query
    queries[query_idx].status = "resolved";
    queries[query_idx].resolved_by = "admin";
    if (remarks) {
      queries[query_idx].remarks_by_admin = remarks;
    }

    await advocateDocRef.update({ queries });

    // 3️⃣ Get linked client documentId from this query
    const clientDocId = queries[query_idx].documentId;

    if (clientDocId) {
      const clientDocRef = userQueryRef.doc(clientDocId);
      const clientDocSnap = await clientDocRef.get();

      if (clientDocSnap.exists) {
        const clientQueries = clientDocSnap.data().queries || [];

        if (query_idx >= 0 && query_idx < clientQueries.length) {
          clientQueries[query_idx].status = "resolved";
          clientQueries[query_idx].resolved_by = "admin";
          if (remarks) {
            clientQueries[query_idx].remarks = remarks;
          }
          await clientDocRef.update({ queries: clientQueries });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Query updated successfully by admin in both documents",
      updated_query: queries[query_idx],
    });
  } catch (error) {
    console.error("Error updating query status by admin:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// exports.getAssignedQuery = async(req, res) =>{
//   const {phone} = req.body;
// }
