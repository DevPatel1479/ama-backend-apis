const express = require("express");
const {
  raiseQuery,
  getQueries,
} = require("../controllers/raise.user.query.controller");

const router = express.Router();

router.post("/raise-query", raiseQuery);
router.get("/get-query", getQueries);

module.exports = router;
