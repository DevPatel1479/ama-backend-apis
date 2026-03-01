const express = require("express");
const router = express.Router();
const {
  fetchBillCutLeadsTest,
  fetchBillCutLeadsAdmin,
} = require("../controllers/billCutLeads.controller");

router.get("/billCut-leads", fetchBillCutLeadsTest);
router.get("/billCut-leads/admin", fetchBillCutLeadsAdmin);

module.exports = router;
