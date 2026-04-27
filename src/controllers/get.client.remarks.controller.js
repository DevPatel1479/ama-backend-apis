// controllers/getClientRemarksController.js

const { crmDb } = require("../config/crmFirebase");
const { db } = require("../config/firebase");
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

    const loginSnapshot = await db
      .collection("login_users")
      .where("phone", "==", phone)
      .limit(1)
      .get();

    if (loginSnapshot.empty) {
      return res.status(200).json({
        success: true,
        message: "No records found for this phone number.",
        data: [],
      });
    }

    const loginUser = loginSnapshot.docs[0].data();
    const serviceType = loginUser.service_type || "";

    let snapshot;

    // 📌 Query Firestore: clients collection
    if (serviceType === "loan settlement") {
      snapshot = await crmDb
        .collection("clients")
        .where("phone", "==", phone)
        .limit(1)
        .get();
    } else {
      snapshot = await db
        .collection("login_users")
        .where("phone", "==", phone)
        .limit(1)
        .get();
    }
    // 🔴 No match
    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        message: "No records found for this phone number.",
        data: [],
      });
    }

    const clientDoc = snapshot.docs[0].data();
    const statusArray = clientDoc.client_app_status || [];

    // 🔴 Validate structure
    if (!Array.isArray(statusArray)) {
      return res.status(200).json({
        success: true,
        message: "Invalid data format in Firestore.",
        data: [],
      });
    }

    // 🔄 FASTEST → reverse the array (latest appended at bottom)
    const reversed = [...statusArray].reverse(); // O(n)

    // 🟢 Prepare Flutter-friendly format
    const responseData = reversed.map((item, index) => ({
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
