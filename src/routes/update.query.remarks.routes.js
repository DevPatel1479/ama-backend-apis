const express = require("express");
const router = express.Router();

const {
  updateQueryRemarks,
} = require("../controllers/update.query.remarks.controller");

router.patch("/query/update/remarks", updateQueryRemarks);

module.exports = router;
