const express = require("express");
const router = express.Router();
const { submitUserQuery, getUserQuery, updateUserQueryStatus, getAdminUserQuery, updateAdminUserQueryStatus } = require("../controllers/user.query.controller");

router.post("/submit-user-query", submitUserQuery);
router.get("/get-user-query", getUserQuery);
router.post("/update-query-status", updateUserQueryStatus);
router.get("/get-admin-user-query", getAdminUserQuery);
router.post("/update-admin-query-status", updateAdminUserQueryStatus);


module.exports = router;