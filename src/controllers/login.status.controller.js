const { db } = require("../config/firebase");

exports.updateLoginStatus = async (req, res) => {
  try {
    const { phone, logout } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const phoneWith91 = `91${phone}`;
    const isLoggedIn = logout === true ? false : true;

    const userRef = db.collection("login_users").doc(phoneWith91);

    await userRef.set(
      {
        isLoggedIn,
        updatedAt: new Date(),
      },
      { merge: true }, // IMPORTANT: backward compatible
    );

    return res.status(200).json({
      success: true,
      phone: phoneWith91,
      isLoggedIn,
    });
  } catch (error) {
    console.error("Login status update error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
