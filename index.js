const express = require("express");
const app = express();
require("dotenv").config({ path: ".env.local" });
const registerRoutes = require("./src/routes/register.route");
const loginRoutes = require('./src/routes/login.route');
const otpRoutes = require("./src/routes/otp.route");
const clearOtpRoute = require('./src/routes/clear.otp.route');
const fileRoutes = require('./src/routes/file.routes');
const questionRoutes = require('./src/routes/question.routes');
const addCommentsRoutes = require('./src/routes/add.comments.route');
const replyRoute = require('./src/routes/reply.route');
const userProfileRoute = require('./src/routes/get.user.profile.route');
const userQueryRoutes = require("./src/routes/user.query.routes");

app.use(express.json());
app.use("/api", registerRoutes);
app.use("/api", loginRoutes);
app.use("/api",clearOtpRoute);
app.use("/api",fileRoutes);
app.use("/api", questionRoutes);
app.use("/api",addCommentsRoutes);
app.use('/api', userProfileRoute);
app.use("/api/otp",otpRoutes);
app.use('/api/reply', replyRoute);
app.use('/api', userQueryRoutes);

// ✅ Error handler for Multer file size limits
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File size exceeds 3MB limit.',
    });
  }

  // Optional: Handle other errors
  return res.status(500).json({
    success: false,
    message: 'Internal server error.',
    error: err.message,
  });
});

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));


if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
}


module.exports = app;