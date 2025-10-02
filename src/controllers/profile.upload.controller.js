const { db, bucket } = require("../config/firebase");
const multer = require("multer");
const path = require("path");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, JPG, PNG files are allowed"), false);
    }
    cb(null, true);
  },
}).single("profile_photo"); // field name in request

// Upload profile photo
const uploadProfilePhoto = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const { phone, role } = req.body;
    if (!phone || !role) {
      return res
        .status(400)
        .json({ success: false, message: "Phone and role are required" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Profile photo is required" });
    }

    const fileName = phone; // save file as phone name
    const file = bucket.file(fileName);
    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on("error", (error) => {
      return res.status(500).json({ success: false, message: error.message });
    });

    stream.on("finish", async () => {
      // Make the file public (or generate signed URL)
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: "03-01-2500", // long-lived URL
      });

      // Update Firestore
      const docName = `${role}_${phone}`;
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
  });
};

// Update profile photo (replace)
const updateProfilePhoto = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const { phone, role } = req.body;
    if (!phone || !role) {
      return res
        .status(400)
        .json({ success: false, message: "Phone and role are required" });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "New profile photo is required" });
    }

    const fileName = phone;
    const file = bucket.file(fileName);

    try {
      // Delete existing file if exists
      const [exists] = await file.exists();
      if (exists) {
        await file.delete();
      }

      // Upload new file
      const stream = file.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      stream.on("error", (error) => {
        return res.status(500).json({ success: false, message: error.message });
      });

      stream.on("finish", async () => {
        const [url] = await file.getSignedUrl({
          action: "read",
          expires: "03-01-2500",
        });

        // Update Firestore
        const docName = `${role}_${phone}`;
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

module.exports = {
  uploadProfilePhoto,
  updateProfilePhoto,
};
