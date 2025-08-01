const express = require("express");
const router = express.Router();
const { addComment } = require("../controllers/add.comments.controller");

router.post("/add-comment", addComment);

module.exports = router;


