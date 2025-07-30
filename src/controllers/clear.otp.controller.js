const  {clearOtpSession} = require("../services/clear.otp.session");


exports.clearOtpSessionForUser = async (req, res) =>{
    try{
        const { phone, role } = req.body;
        if (!phone || !role) return res.status(400).json({ success: false, message: "Phone and role are required" });
        const successResult = await clearOtpSession(phone, role);
        if (successResult){
            res.status(200).json({ success: true, message: "otp session cleared!!" }); // You can remove `otp` in production
            
        }

    }catch(error){
        res.status(500).json({ success: false, message: error.message });
    }
    
}