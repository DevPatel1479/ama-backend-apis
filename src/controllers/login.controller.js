const { db } = require("../config/firebase");

exports.loginUser = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const snapshot = await db
      .collection("login_users")
      .where("phone", "==", phone)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res
        .status(404)
        .json({ error: "User with this phone number not found" });
    }

    const userDoc = snapshot.docs[0];
    const data = userDoc.data();
    const role = data.role || "unknown";
    const name = data.name || "N/A";
    const email = data.email || "N/A";
    const finalData = {
      role: role,
      name: name,
      email: email,
    };
    return res.status(200).json(finalData);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
