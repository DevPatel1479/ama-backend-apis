const express = require("express");
const router = express.Router();
const {
  fetchAmaLeadsTest,
  fetchAmaLeadsAdmin,
} = require("../controllers/amaLeads.controller");

router.get("/ama-leads", fetchAmaLeadsTest);
router.get("/ama-leads/admin", fetchAmaLeadsAdmin);

module.exports = router;
