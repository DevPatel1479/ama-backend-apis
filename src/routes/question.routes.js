const express = require("express");
const {
  createQuestion,
  getQuestions,
  getUserQuestions,
  addAnswer,
} = require("../controllers/question.controller");

const router = express.Router();

router.post("/create", createQuestion);
router.get("/get", getQuestions);
router.get("/user/:userId", getUserQuestions);
router.get("/add/:questionId/answer", addAnswer);

module.exports = router;
