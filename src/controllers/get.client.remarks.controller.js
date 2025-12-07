// controllers/getClientRemarksController.js

const { crmDb } = require("../config/crmFirebase");

exports.getClientRemarks = async (req, res) => {
  try {
    const { phone } = req.query;

    // 🔴 Validate phone input
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
        data: [],
      });
    }

    // 📌 Firestore Query (Assuming "clients" collection)
    const snapshot = await crmDb
      .collection("clients")
      .where("phone", "==", `91${phone}`)
      .get();

    // 🔴 No matching client found
    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        message: "No records found for this phone number.",
        data: [], // always return empty array
      });
    }

    // ✔ Firestore can return multiple matches (rare but possible)
    const clientDoc = snapshot.docs[0].data();

    const statusArray = clientDoc.client_app_status || [];

    if (!Array.isArray(statusArray)) {
      return res.status(200).json({
        success: true,
        message: "Invalid data format in Firestore.",
        data: [],
      });
    }

    // 🔄 Sort remarks by most recent (createdAt DESC)
    const sorted = [...statusArray].sort((a, b) => {
      const t1 = a.createdAt || 0;
      const t2 = b.createdAt || 0;
      return t2 - t1; // newest first
    });

    // 🟢 Format clean & Flutter-friendly data
    const responseData = sorted.map((item, index) => ({
      index: item.index ?? index.toString(),
      remarks: item.remarks ?? "",
      createdAt: item.createdAt ?? 0,
    }));

    return res.status(200).json({
      success: true,
      message: "Remarks fetched successfully.",
      data: responseData,
    });
  } catch (error) {
    console.error("🔥 Error fetching remarks:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching remarks.",
      data: [],
    });
  }
};
