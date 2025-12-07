// team.routes.js
const express = require("express");
const router = express.Router();
const { getTeamMembers } = require("../controllers/team.controller");

router.get("/data", getTeamMembers);

module.exports = router;
