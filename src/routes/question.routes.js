const express = require("express");
const {
  createQuestion,
  createQuestionV2,
  getQuestions,
  getUserQuestions,
  addAnswer,
  searchQuestions,
} = require("../controllers/question.controller");

const { deleteQuestion } = require("../controllers/delete.question.controller");

const router = express.Router();

router.post("/create", createQuestion);
router.post("/create/v2", createQuestionV2);
router.get("/get", getQuestions);
router.get("/user/:userId", getUserQuestions);
router.post("/add/:questionId/answer", addAnswer);
router.delete("/delete-question", deleteQuestion);
router.get("/search-questions", searchQuestions);
module.exports = router;
