// controllers/checkServiceTypeController.js

const { db } = require("../config/firebase");

exports.checkServiceType = async (req, res) => {
  try {
    const { phone } = req.query;

    // Validate phone number
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required.",
        isLoanSettlement: false,
      });
    }

    // Query login_users collection
    const snapshot = await db
      .collection("login_users")
      .where("phone", "==", `91${phone}`)
      .limit(1)
      .get();

    // User not found
    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
        isLoanSettlement: false,
      });
    }

    const userData = snapshot.docs[0].data();
    const serviceType = userData.service_type || "";

    return res.status(200).json({
      success: true,
      message: "Service type fetched successfully.",
      isLoanSettlement: serviceType === "loan settlement",
      serviceType,
    });
  } catch (error) {
    console.error("🔥 Error checking service type:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while checking service type.",
      isLoanSettlement: false,
    });
  }
};
