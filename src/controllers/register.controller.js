const { db } = require("../config/firebase");

exports.registerUser = async (req, res) => {
  const { name, email, phone, state, query, source, role } = req.body;
  const docId = `91${phone}`;
  const loginUsersRef = db.collection("login_users").doc(docId);

  try {
    const doc = await loginUsersRef.get();
    if (doc.exists) {
      return res
        .status(409)
        .json({ message: "User already exists. Please sign in." });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const today = new Date();
    const start_date = today.toISOString().split("T")[0];

    await loginUsersRef.set({
      id: docId,
      name,
      email,
      phone: `91${phone}`,
      role,
      created_at: timestamp,
      updated_at: timestamp,
      status: "active",
      start_date,
    });

    await db.collection("leads").add({
      name,
      email,
      phone: `91${phone}`,
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
