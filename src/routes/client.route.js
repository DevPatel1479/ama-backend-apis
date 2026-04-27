const express = require("express");
const router = express.Router();
const {
  getWeeklyClientCount,
} = require("../controllers/client.week.count.controller");

const {
  getClientRemarks,
} = require("../controllers/get.client.remarks.controller");

const {
  checkServiceType,
} = require("../controllers/check.service.type.controller");

router.post("/week-count", getWeeklyClientCount);
router.get("/remarks", getClientRemarks);
router.get("/check-service-type", checkServiceType);
module.exports = router;
