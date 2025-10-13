const express = require("express");
const router = express.Router();
const {
  getWeeklyClientCount,
} = require("../controllers/client.week.count.controller");

router.post("/week-count", getWeeklyClientCount);

module.exports = router;
