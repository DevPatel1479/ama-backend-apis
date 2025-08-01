const { db, bucket } = require('../config/firebase');
const path = require('path');

exports.uploadFile = async (req, res) => {
  try {
    const { phone, role } = req.body;
    const file = req.file;

    if (!phone || !role || !file) {
      return res.status(400).json({ success: false, message: 'Missing phone, role or file.' });
    }

    const userDocId = `${role}_${phone}`;
    const userDoc = await db.collection('login_users').doc(userDocId).get();

    if (!userDoc.exists) {
      return res.status(403).json({ success: false, message: 'User not authorized.' });
    }

    const fileName = `${Date.now()}_${file.originalname}`;
    const fileUpload = bucket.file(`questions/${fileName}`);

    const stream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    stream.on('error', (err) => {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Upload error.' });
    });

    stream.on('finish', async () => {
      // Make public and get URL
      await fileUpload.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/questions/${fileName}`;

      return res.status(200).json({ success: true, url: publicUrl });
    });

    stream.end(file.buffer);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};
