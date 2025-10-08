const express = require("express");
const router = express.Router();

const { resolveQuery } = require("../controllers/resolve.query.controller");

router.post("/resolved", resolveQuery);

module.exports = router;
