const express = require("express");
const {
  raiseQuery,
  getQueries,
  raiseQueryV2,
  getQueriesV2,
} = require("../controllers/raise.user.query.controller");

const router = express.Router();

router.post("/raise-query", raiseQuery);
router.get("/get-query", getQueries);

router.post("/raise-query/v2", raiseQueryV2);
router.get("/get-query/v2", getQueriesV2);

module.exports = router;
