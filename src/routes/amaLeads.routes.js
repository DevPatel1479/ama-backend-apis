const express = require("express");
const router = express.Router();
const { fetchAmaLeadsTest } = require("../controllers/amaLeads.controller");

router.get("/ama-leads", fetchAmaLeadsTest);

module.exports = router;
