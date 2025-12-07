const express = require("express");
const router = express.Router();
const {
  getWeeklyClientCount,
} = require("../controllers/client.week.count.controller");

const {
  getClientRemarks,
} = require("../controllers/get.client.remarks.controller");

router.post("/week-count", getWeeklyClientCount);
router.get("/remarks", getClientRemarks);
module.exports = router;
