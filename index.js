const express = require("express");
const app = express();
require("dotenv").config({ path: ".env.local" });
const registerRoutes = require("./src/routes/register.route");
const loginRoutes = require('./src/routes/login.route');
const otpRoutes = require("./src/routes/otp.route");
const clearOtpRoute = require('./src/routes/clear.otp.route');

app.use(express.json());
app.use("/api", registerRoutes);
app.use("/api", loginRoutes);
app.use("/api/otp",otpRoutes);
app.use("/api/",clearOtpRoute);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
