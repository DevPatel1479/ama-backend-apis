const { db } = require("../config/firebase");

exports.registerUser = async (req, res) => {
  const { name, email, phone, state, query, source, role } = req.body;
  const docId = `${role}_${phone}`;
  const loginUsersRef = db.collection("login_users").doc(docId);

  try {
    const doc = await loginUsersRef.get();
    if (doc.exists) {
      return res
        .status(409)
        .json({ message: "User already exists. Please sign in." });
    }

    const timestamp = Math.floor(Date.now() / 1000);

    await loginUsersRef.set({
      id: docId,
      name,
      email,
      phone,
      role,
      created_at: timestamp,
      updated_at: timestamp,
      status: "active",
    });

    await db.collection("leads").add({
      name,
      email,
      phone,
      state,
      query: query || null,
      source,

      created_at: timestamp,
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Something went wrong." });
  }
};
