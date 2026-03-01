const { crmDb } = require("../config/crmFirebase");

exports.fetchBillCutLeadsTest = async (req, res) => {
  try {
    let { name, limit = 20, cursorId, search } = req.query;
    limit = Number(limit);

    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    // ---------------- NORMAL FLOW (NO SEARCH) ----------------
    if (!search || !search.trim()) {
      let query = crmDb
        .collection("billcutLeads")
        .where("assigned_to", "==", name) // KEEP your DB-level filter
        .orderBy("synced_date", "desc")
        .orderBy("__name__")
        .limit(limit);

      if (cursorId) {
        const lastDocSnap = await crmDb
          .collection("billcutLeads")
          .doc(cursorId)
          .get();
        if (lastDocSnap.exists) {
          query = query.startAfter(
            lastDocSnap.get("synced_date"),
            lastDocSnap.id,
          );
        }
      }

      const snapshot = await query.get();
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      return res.json({
        totalFetched: snapshot.size,
        matchedCount: data.length,
        data,
        nextCursorId: lastDoc ? lastDoc.id : null,
        hasMore: snapshot.docs.length === limit,
        message: "Firestore-native pagination using docId cursor",
      });
    }

    // ---------------- SEARCH FLOW (LAYERED) ----------------
    const searchLower = search.toLowerCase().trim();
    const queries = [];

    const createBaseQuery = () => {
      let q = crmDb.collection("billcutLeads").where("assigned_to", "==", name); // KEEP your backend filter
      return q;
    };

    // Phone search
    const stripped = searchLower.replace(/\D/g, "");
    if (stripped.length >= 4) {
      const num = Number(stripped);
      if (!isNaN(num)) {
        queries.push(
          createBaseQuery().where("mobile", "==", num).limit(50).get(),
        );
        queries.push(
          createBaseQuery().where("phone", "==", num).limit(50).get(),
        );
        queries.push(
          createBaseQuery().where("number", "==", num).limit(50).get(),
        );
      }
      // Numeric Range Match
      if (stripped.length > 0 && stripped.length < 10 && !isNaN(num)) {
        const padCount = 10 - stripped.length;
        const min = num * Math.pow(10, padCount);
        const max = min + Math.pow(10, padCount) - 1;
        queries.push(
          createBaseQuery()
            .where("mobile", ">=", min)
            .where("mobile", "<=", max)
            .limit(50)
            .get(),
        );
        queries.push(
          createBaseQuery()
            .where("phone", ">=", min)
            .where("phone", "<=", max)
            .limit(50)
            .get(),
        );
        queries.push(
          createBaseQuery()
            .where("number", ">=", min)
            .where("number", "<=", max)
            .limit(50)
            .get(),
        );
      }

      // String Range Match for Phone
      queries.push(
        createBaseQuery()
          .where("mobile", ">=", stripped)
          .where("mobile", "<=", stripped + "\uf8ff")
          .limit(50)
          .get(),
      );
      queries.push(
        createBaseQuery()
          .where("phone", ">=", stripped)
          .where("phone", "<=", stripped + "\uf8ff")
          .limit(50)
          .get(),
      );
      queries.push(
        createBaseQuery()
          .where("number", ">=", stripped)
          .where("number", "<=", stripped + "\uf8ff")
          .limit(50)
          .get(),
      );
    }

    // Name search (same multi-case logic as client backend)
    const terms = new Set([
      search,
      searchLower,
      searchLower.charAt(0).toUpperCase() + searchLower.slice(1),
      searchLower.toUpperCase(),
    ]);

    terms.forEach((term) => {
      if (!term) return;
      queries.push(
        createBaseQuery()
          .where("name", ">=", term)
          .where("name", "<=", term + "\uf8ff")
          .limit(50)
          .get(),
      );
    });

    const snapshots = await Promise.all(queries);

    const mergedDocs = new Map();
    snapshots.forEach((snap) => {
      snap.docs.forEach((doc) => {
        if (!mergedDocs.has(doc.id)) mergedDocs.set(doc.id, doc);
      });
    });

    const allDocs = Array.from(mergedDocs.values());
    allDocs.sort((a, b) => {
      const aTs = a.get("synced_date");
      const bTs = b.get("synced_date");

      const aTime =
        aTs && typeof aTs.toMillis === "function" ? aTs.toMillis() : 0;
      const bTime =
        bTs && typeof bTs.toMillis === "function" ? bTs.toMillis() : 0;

      return bTime - aTime; // latest first
    });

    // 🔥 Keep your cursor pagination behavior for search results
    let startIndex = 0;
    if (cursorId) {
      const idx = allDocs.findIndex((d) => d.id === cursorId);
      if (idx !== -1) startIndex = idx + 1;
    }

    const paginatedDocs = allDocs.slice(startIndex, startIndex + limit);

    const data = paginatedDocs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastDoc = paginatedDocs[paginatedDocs.length - 1];

    return res.json({
      totalFetched: paginatedDocs.length,
      matchedCount: allDocs.length,
      data,
      nextCursorId: lastDoc ? lastDoc.id : null,
      hasMore: paginatedDocs.length === limit,
      message: "Search layered on top of Firestore-native pagination",
    });
  } catch (err) {
    console.error("BillCut Leads Test Error:", err);
    return res.status(500).json({ message: "Error fetching leads" });
  }
};

exports.fetchBillCutLeadsAdmin = async (req, res) => {
  try {
    let { role, limit = 20, cursorId, search } = req.query;
    if (role !== "admin") {
      return res.status(403).json({
        message: "Forbidden: Unauthenticated or insufficient permissions",
      });
    }
    limit = Number(limit);

    // ---------------- NORMAL FLOW (NO SEARCH) ----------------
    if (!search || !search.trim()) {
      let query = crmDb
        .collection("billcutLeads")
        .orderBy("synced_date", "desc") // KEEP your sorting
        .orderBy("__name__")
        .limit(limit);

      if (cursorId) {
        const lastDocSnap = await crmDb
          .collection("billcutLeads")
          .doc(cursorId)
          .get();
        if (lastDocSnap.exists) {
          query = query.startAfter(
            lastDocSnap.get("synced_date"),
            lastDocSnap.id,
          );
        }
      }

      const snapshot = await query.get();
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      return res.json({
        totalFetched: snapshot.size,
        matchedCount: data.length,
        data,
        nextCursorId: lastDoc ? lastDoc.id : null,
        hasMore: snapshot.docs.length === limit,
        message: "Admin fetched ALL BillCut leads (latest first)",
      });
    }

    // ---------------- SEARCH FLOW (LAYERED) ----------------
    const searchLower = search.toLowerCase().trim();
    const queries = [];

    const createBaseQuery = () => crmDb.collection("billcutLeads");

    // Phone search
    const stripped = searchLower.replace(/\D/g, "");
    if (stripped.length >= 4) {
      const num = Number(stripped);
      if (!isNaN(num)) {
        queries.push(
          createBaseQuery().where("mobile", "==", num).limit(50).get(),
        );
        queries.push(
          createBaseQuery().where("phone", "==", num).limit(50).get(),
        );
        queries.push(
          createBaseQuery().where("number", "==", num).limit(50).get(),
        );
      }
      // Numeric Range Match
      if (stripped.length > 0 && stripped.length < 10 && !isNaN(num)) {
        const padCount = 10 - stripped.length;
        const min = num * Math.pow(10, padCount);
        const max = min + Math.pow(10, padCount) - 1;
        queries.push(
          createBaseQuery()
            .where("mobile", ">=", min)
            .where("mobile", "<=", max)
            .limit(50)
            .get(),
        );
        queries.push(
          createBaseQuery()
            .where("phone", ">=", min)
            .where("phone", "<=", max)
            .limit(50)
            .get(),
        );
        queries.push(
          createBaseQuery()
            .where("number", ">=", min)
            .where("number", "<=", max)
            .limit(50)
            .get(),
        );
      }

      // String Range Match for Phone
      queries.push(
        createBaseQuery()
          .where("mobile", ">=", stripped)
          .where("mobile", "<=", stripped + "\uf8ff")
          .limit(50)
          .get(),
      );
      queries.push(
        createBaseQuery()
          .where("phone", ">=", stripped)
          .where("phone", "<=", stripped + "\uf8ff")
          .limit(50)
          .get(),
      );
      queries.push(
        createBaseQuery()
          .where("number", ">=", stripped)
          .where("number", "<=", stripped + "\uf8ff")
          .limit(50)
          .get(),
      );
    }

    // Name search
    const terms = new Set([
      search,
      searchLower,
      searchLower.charAt(0).toUpperCase() + searchLower.slice(1),
      searchLower.toUpperCase(),
    ]);

    terms.forEach((term) => {
      if (!term) return;
      queries.push(
        createBaseQuery()
          .where("name", ">=", term)
          .where("name", "<=", term + "\uf8ff")
          .limit(50)
          .get(),
      );
    });

    const snapshots = await Promise.all(queries);

    const mergedDocs = new Map();
    snapshots.forEach((snap) => {
      snap.docs.forEach((doc) => {
        if (!mergedDocs.has(doc.id)) mergedDocs.set(doc.id, doc);
      });
    });

    const allDocs = Array.from(mergedDocs.values());
    allDocs.sort((a, b) => {
      const aTs = a.get("synced_date");
      const bTs = b.get("synced_date");

      const aTime =
        aTs && typeof aTs.toMillis === "function" ? aTs.toMillis() : 0;
      const bTime =
        bTs && typeof bTs.toMillis === "function" ? bTs.toMillis() : 0;

      return bTime - aTime; // latest first
    });
    // 🔥 Keep your cursor pagination behavior
    let startIndex = 0;
    if (cursorId) {
      const idx = allDocs.findIndex((d) => d.id === cursorId);
      if (idx !== -1) startIndex = idx + 1;
    }

    const paginatedDocs = allDocs.slice(startIndex, startIndex + limit);

    const data = paginatedDocs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const lastDoc = paginatedDocs[paginatedDocs.length - 1];

    return res.json({
      totalFetched: paginatedDocs.length,
      matchedCount: allDocs.length,
      data,
      nextCursorId: lastDoc ? lastDoc.id : null,
      hasMore: paginatedDocs.length === limit,
      message: "Admin search layered on top of Firestore-native pagination",
    });
  } catch (err) {
    console.error("BillCut Leads Admin Error:", err);
    return res.status(500).json({ message: "Error fetching admin leads" });
  }
};
