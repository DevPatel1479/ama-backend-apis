const {db} = require("../config/firebase");

exports.getUserProfile = async (req, res) =>{
    const { role, phone } = req.body;
    if (!role || !phone) {
        return res.status(400).json({
        success: false,
        message: 'Role and phone are required'
        });
    }
    const docId = `${role}_${phone}`;
    try {
        const docRef = db.collection('login_users').doc(docId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({
                success: false,
                message: 'No such user found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile fetched successfully',
            data: docSnap.data()
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }

}


exports.getUserCompleteInfo = async (req, res) => {
    const {phone} = req.body;
    const docId = `ama_client_${phone}`;
    try {
        const docRef = db.collection('app_clients').doc(docId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            return res.status(404).json({
                success: false,
                message: 'No such user found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'User information fetched successfully',
            data: docSnap.data()
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        });
    }


}