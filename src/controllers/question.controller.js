const { db, admin } = require("../config/firebase");
const {
  sendAnswerNotificationBackground,
} = require("../services/notification.service");
// POST: Create a new question
const createQuestion = async (req, res) => {
  try {
    const { userId, userName, userRole, phone, profileImgUrl, content } =
      req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newQuestionRef = db.collection("questions").doc();

    const unixTimestamp = Date.now(); // ✅ Universal Unix timestamp in ms (UTC)

    const questionData = {
      userId,
      userName,
      userRole,
      phone,
      profileImgUrl: profileImgUrl || null,
      content,
      timestamp: unixTimestamp, // ✅ stored as Unix timestamp
      answer: null,
    };

    await newQuestionRef.set(questionData);

    res.status(201).json({ id: newQuestionRef.id, ...questionData });
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET: Fetch all questions with pagination
const getQuestions = async (req, res) => {
  try {
    const { limit = 10, lastVisible } = req.query;

    let query = db
      .collection("questions")
      .orderBy("timestamp", "desc")
      .limit(Number(limit));

    if (lastVisible) {
      const lastDoc = await db.collection("questions").doc(lastVisible).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc.data().timestamp);
      }
    }

    const snapshot = await query.get();
    const questions = [];

    snapshot.forEach((doc) => {
      questions.push({ id: doc.id, ...doc.data() });
    });

    res.json({
      questions,
      lastVisible:
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1].id
          : null,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUserQuestions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, lastVisible } = req.query;

    console.log("Fetching for userId:", userId);

    let query = db
      .collection("questions")
      .where("userId", "==", userId)
      .orderBy("timestamp", "desc")
      .limit(Number(limit));

    // ✅ Pagination using Unix timestamp
    if (lastVisible) {
      const lastTimestamp = Number(lastVisible); // convert query param to number
      query = query.startAfter(lastTimestamp);
    }

    const snapshot = await query.get();
    const questions = [];

    snapshot.forEach((doc) => {
      questions.push({ id: doc.id, ...doc.data() });
    });

    // Send back the last timestamp for next pagination
    const newLastVisible =
      snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1].data().timestamp
        : null;

    res.json({
      questions,
      lastVisible: newLastVisible,
    });
  } catch (error) {
    console.error("Error fetching user questions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST: Add or update an answer to a question
const addAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content, answeredBy, role, questionOwnerPhone } = req.body;

    if (!questionId || !content || !answeredBy || !role) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const questionRef = db.collection("questions").doc(questionId);
    const questionSnapshot = await questionRef.get();
    const questionData = questionSnapshot.data();
    const phone = questionOwnerPhone;
    const userRole = questionData.userRole;

    if (!questionSnapshot.exists) {
      return res.status(404).json({ error: "Question not found" });
    }

    const unixTimestamp = Date.now(); // Universal Unix timestamp

    const answerData = {
      content,
      answered_by: answeredBy,
      role,
      timestamp: unixTimestamp,
    };

    await questionRef.update({ answer: answerData });

    await sendAnswerNotificationBackground({
      phone,
      answered_by: answeredBy,
      answer_content: content,
      user_role: userRole,
      questionId: questionId,
    });
    res
      .status(200)
      .json({ message: "Answer added successfully", answer: answerData });
  } catch (error) {
    console.error("Error adding answer:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  getUserQuestions,
  addAnswer,
};
