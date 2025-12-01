const { db } = require("../config/firebase"); // adjust path to your firebase config file

// GET /api/leads/:phone
exports.getLeadByPhone = async (req, res) => {
  try {
    const phone = `91${req.params.phone}`;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    // Query Firestore collection "leads" where phone == provided phone
    const snapshot = await db
      .collection("leads")
      .where("phone", "==", phone)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        message: "No user found with this phone number",
      });
    }

    // Since phone is unique, get first doc
    const doc = snapshot.docs[0];
    const userData = { id: doc.id, ...doc.data() };

    return res.status(200).json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// 🆕 UPDATE LEAD + LOGIN_USERS
exports.updateUserData = async (req, res) => {
  try {
    const { phone, name, email, state } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required for update",
      });
    }

    // Fetch the user document from 'leads' first
    const leadSnap = await db
      .collection("leads")
      .where("phone", "==", `91${phone}`)
      .limit(1)
      .get();

    if (leadSnap.empty) {
      return res.status(404).json({
        success: false,
        message: "Lead not found with this phone number",
      });
    }

    const leadDoc = leadSnap.docs[0];
    const leadData = leadDoc.data();
    const role = leadData.role || "user"; // fallback if role missing
    const loginUserId = `91${phone}`;

    // Prepare update objects dynamically
    const leadUpdateData = {};
    const loginUserUpdateData = {};

    if (name) {
      leadUpdateData.name = name;
      loginUserUpdateData.name = name;
    }
    if (email) {
      leadUpdateData.email = email;
      loginUserUpdateData.email = email;
    }
    if (state) {
      // Only update state in leads, not in login_users
      leadUpdateData.state = state;
    }

    if (
      Object.keys(leadUpdateData).length === 0 &&
      Object.keys(loginUserUpdateData).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    // Prepare document references
    const leadRef = db.collection("leads").doc(leadDoc.id);
    const loginUserRef = db.collection("login_users").doc(loginUserId);

    // Execute updates in parallel for speed
    await Promise.all([
      Object.keys(leadUpdateData).length > 0
        ? leadRef.update(leadUpdateData)
        : Promise.resolve(),
      Object.keys(loginUserUpdateData).length > 0
        ? loginUserRef.update(loginUserUpdateData).catch((err) => {
            console.warn("login_users update skipped:", err.message);
          })
        : Promise.resolve(),
    ]);

    return res.status(200).json({
      success: true,
      message: "User data updated successfully",
      updated: {
        leads: leadUpdateData,
        login_users: loginUserUpdateData,
      },
    });
  } catch (error) {
    console.error("Error updating user data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
