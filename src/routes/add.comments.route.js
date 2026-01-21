const express = require("express");
const router = express.Router();
const {
  addComment,
  getComments,
  getCommentsCount,
} = require("../controllers/add.comments.controller");

const { deleteComment } = require("../controllers/delete.comment.controller");

router.post("/add", addComment);
router.post("/get", getComments);
router.get("/get/:questionId/count", getCommentsCount);
router.delete("/delete-comment", deleteComment);
module.exports = router;
