const {db, admin} = require('../config/firebase');


exports.sendTopicNotification = async (req, res) => {
    try {
        const { user_id, topic, n_title, n_body, role_count } = req.body;

        if (!user_id || !topic  || !n_title  || !n_body || !role_count) {
            return res.status(400).json({ success: false, message: 'user_id, topic, n_title, n_body and role_count are required' });
        }

        const topics = Array.isArray(topic) ? topic : [topic];


        // if (topic === "admin") {
        //     return res.status(403).json({ success: false, message: 'Sending to admin topic is not allowed' });
        // }
         // Prevent sending to "admin"

        if (topics.includes("admin")) {
            return res.status(403).json({ 
                success: false, 
                message: 'Sending to admin topic is not allowed' 
            });
        }

        // Check if the user exists
        const userDoc = await db.collection('login_users').doc(user_id).get();
        if (!userDoc.exists) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Notification payload
        const message = {
            notification: {
                title: n_title,
                body: n_body
            },
            topic: topic
        };

        // // Send to topic
        // await admin.messaging().send(message);
          const sendPromises = topics.map(async (t) => {
            const msg = { ...messagePayload, topic: t };
            return admin.messaging().send(msg);
        });

        await Promise.all(sendPromises);

        return res.status(200).json({ success: true, message: `Notification sent to topic: ${topic}` });

    } catch (error) {
        console.error("Error sending notification:", error);
        return res.status(500).json({ success: false, message: 'Failed to send notification', error: error.message });
    }
};
