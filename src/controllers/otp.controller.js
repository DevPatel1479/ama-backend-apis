const { sendOTP, verifyOTP } = require("../services/otp.service");



exports.sendOtpController = async (req, res) => {
  try {
    const { phone, role } = req.body;
    if (!phone || !role) return res.status(400).json({ success: false, message: "Phone and role are required" });
    
    const otp = await sendOTP(phone, role);
    res.status(200).json({ success: true, message: "OTP sent successfully", otp }); // You can remove `otp` in production
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyOtpController = async (req, res) => {
  try {
    const { phone, role, otp } = req.body;
    if (!phone || !role || !otp) return res.status(400).json({ success: false, message: "Phone, role, and OTP are required" });

    await verifyOTP(phone, role, otp);
    res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
