const express = require("express");
const router = express.Router();
const { submitUserQuery, getUserQuery, updateUserQueryStatus } = require("../controllers/user.query.controller");

router.post("/submit-user-query", submitUserQuery);
router.get("/get-user-query", getUserQuery);
router.post("/update-query-status", updateUserQueryStatus);


module.exports = router;