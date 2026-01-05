const express = require("express");
const router = express.Router();

const {
  resolveQuery,
  resolveQueryV2,
} = require("../controllers/resolve.query.controller");

router.post("/resolved", resolveQuery);
router.post("/resolved/v2", resolveQueryV2);

module.exports = router;
