const { db, bucket } = require("../config/firebase");
const multer = require("multer");

// Multer setup
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single("profile_photo"); // field name in request

// Helper to check required fields
const validateFields = (reqBody, requiredFields) => {
  const missing = requiredFields.filter((field) => !reqBody[field]);
  if (missing.length > 0) {
    return `Missing required field(s): ${missing.join(", ")}`;
  }
  return null;
};

// Upload profile photo
const uploadProfilePhoto = (req, res) => {
  upload(req, res, async (err) => {
    if (err)
      return res.status(400).json({ success: false, message: err.message });

    const missingFieldsMessage = validateFields(req.body, ["phone", "role"]);
    if (missingFieldsMessage) {
      return res
        .status(400)
        .json({ success: false, message: missingFieldsMessage });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Profile photo is required" });
    }

    const { phone, role } = req.body;
    const fileName = phone; // Use phone as file name
    const file = bucket.file(fileName);

    try {
      const stream = file.createWriteStream({
        metadata: { contentType: req.file.mimetype },
      });

      stream.on("error", (error) =>
        res.status(500).json({ success: false, message: error.message })
      );

      stream.on("finish", async () => {
        // Make file public
        await file.makePublic();

        // Public permanent URL
        const url = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

        // Update Firestore
        const docName = `91${phone}`;
        const docRef = db.collection("login_users").doc(docName);
        const doc = await docRef.get();

        if (!doc.exists) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }

        await docRef.update({ profile_img: url });

        return res.status(200).json({ success: true, profile_img: url });
      });

      stream.end(req.file.buffer);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });
};

// Update profile photo
const updateProfilePhoto = (req, res) => {
  upload(req, res, async (err) => {
    if (err)
      return res.status(400).json({ success: false, message: err.message });

    const missingFieldsMessage = validateFields(req.body, ["phone", "role"]);
    if (missingFieldsMessage) {
      return res
        .status(400)
        .json({ success: false, message: missingFieldsMessage });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "New profile photo is required" });
    }

    const { phone, role } = req.body;
    const fileName = phone;
    const file = bucket.file(fileName);

    try {
      // Delete old file if exists
      const [exists] = await file.exists();
      if (exists) await file.delete();

      const stream = file.createWriteStream({
        metadata: { contentType: req.file.mimetype },
      });

      stream.on("error", (error) =>
        res.status(500).json({ success: false, message: error.message })
      );

      stream.on("finish", async () => {
        // Make file public
        await file.makePublic();

        // Permanent URL
        const url = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

        const docName = `91${phone}`;
        const docRef = db.collection("login_users").doc(docName);
        const doc = await docRef.get();

        if (!doc.exists) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }

        await docRef.update({ profile_img: url });
        return res.status(200).json({ success: true, profile_img: url });
      });

      stream.end(req.file.buffer);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });
};

const getProfilePhoto = async (req, res) => {
  try {
    const { phone, role } = req.body;

    if (!phone || !role) {
      return res.status(400).json({
        success: false,
        message: "Both phone and role are required",
      });
    }

    const docName = `91${phone}`;
    const docRef = db.collection("login_users").doc(docName);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const data = doc.data();
    const profileImg = data?.profile_img;

    if (!profileImg) {
      return res.status(404).json({
        success: false,
        message: "Profile photo not uploaded yet",
      });
    }

    return res.status(200).json({
      success: true,
      profile_img: profileImg,
    });
  } catch (error) {
    console.error("Error fetching profile photo:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const uploadProfilePhotoV2 = (req, res) => {
  upload(req, res, async (err) => {
    if (err)
      return res.status(400).json({ success: false, message: err.message });

    const missingFieldsMessage = validateFields(req.body, ["phone", "role"]);
    if (missingFieldsMessage) {
      return res
        .status(400)
        .json({ success: false, message: missingFieldsMessage });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Profile photo is required" });
    }

    const { phone, role } = req.body;
    const fileName = phone; // Use phone as file name
    const file = bucket.file(fileName);

    try {
      const stream = file.createWriteStream({
        metadata: { contentType: req.file.mimetype },
      });

      stream.on("error", (error) =>
        res.status(500).json({ success: false, message: error.message })
      );

      stream.on("finish", async () => {
        // Make file public
        await file.makePublic();

        // Public permanent URL
        const url = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

        // Update Firestore
        const docName = `${phone}`;
        const docRef = db.collection("login_users").doc(docName);
        const doc = await docRef.get();

        if (!doc.exists) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }

        await docRef.update({ profile_img: url });

        return res.status(200).json({ success: true, profile_img: url });
      });

      stream.end(req.file.buffer);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });
};

// Update profile photo
const updateProfilePhotoV2 = (req, res) => {
  upload(req, res, async (err) => {
    if (err)
      return res.status(400).json({ success: false, message: err.message });

    const missingFieldsMessage = validateFields(req.body, ["phone", "role"]);
    if (missingFieldsMessage) {
      return res
        .status(400)
        .json({ success: false, message: missingFieldsMessage });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "New profile photo is required" });
    }

    const { phone, role } = req.body;
    const fileName = phone;
    const file = bucket.file(fileName);

    try {
      // Delete old file if exists
      const [exists] = await file.exists();
      if (exists) await file.delete();

      const stream = file.createWriteStream({
        metadata: { contentType: req.file.mimetype },
      });

      stream.on("error", (error) =>
        res.status(500).json({ success: false, message: error.message })
      );

      stream.on("finish", async () => {
        // Make file public
        await file.makePublic();

        // Permanent URL
        const url = `https://storage.googleapis.com/${bucket.name}/${file.name}`;

        const docName = `${phone}`;
        const docRef = db.collection("login_users").doc(docName);
        const doc = await docRef.get();

        if (!doc.exists) {
          return res
            .status(404)
            .json({ success: false, message: "User not found" });
        }

        await docRef.update({ profile_img: url });
        return res.status(200).json({ success: true, profile_img: url });
      });

      stream.end(req.file.buffer);
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });
};

const getProfilePhotoV2 = async (req, res) => {
  try {
    const { phone, role } = req.body;

    if (!phone || !role) {
      return res.status(400).json({
        success: false,
        message: "Both phone and role are required",
      });
    }

    const docName = `${phone}`;
    const docRef = db.collection("login_users").doc(docName);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const data = doc.data();
    const profileImg = data?.profile_img;

    if (!profileImg) {
      return res.status(404).json({
        success: false,
        message: "Profile photo not uploaded yet",
      });
    }

    return res.status(200).json({
      success: true,
      profile_img: profileImg,
    });
  } catch (error) {
    console.error("Error fetching profile photo:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  uploadProfilePhoto,
  updateProfilePhoto,
  getProfilePhoto,
  uploadProfilePhotoV2,
  updateProfilePhotoV2,
  getProfilePhotoV2,
};
