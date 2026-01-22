const express = require("express");
const router = express.Router();

const { getImagesByType } = require("../controllers/image.controller");

/**
 * Mapping:
 * /get/AMA       → ama
 * /get/CaseDesk  → casedesk
 * /get/home      → home
 * /get/services  → services
 */

router.get("/get/:type", getImagesByType);

module.exports = router;
