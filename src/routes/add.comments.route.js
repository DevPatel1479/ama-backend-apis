const express = require("express");
const router = express.Router();
const {
  addComment,
  getComments,
  getCommentsCount,
} = require("../controllers/add.comments.controller");

router.post("/add", addComment);
router.post("/get", getComments);
router.get("/get/:questionId/count", getCommentsCount);

module.exports = router;
