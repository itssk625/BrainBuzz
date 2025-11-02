const express = require('express');
const router = express.Router();
const {
  getAvailableQuizzes,
  getQuiz,
  createQuiz,
  deleteQuiz,
  submitQuiz,
  getMyAttempts,
  getAttempt,
  getQuizAttempts,
  getMyQuizzes
} = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Student routes - get available quizzes
router.get('/available', getAvailableQuizzes);

// Student routes - get single quiz
router.get('/:id', getQuiz);

// Student routes - submit quiz
router.post('/:id/submit', submitQuiz);

// Student routes - get my attempts
router.get('/attempts/my', getMyAttempts);

// Student routes - get specific attempt
router.get('/attempts/:attemptId', getAttempt);

// Instructor routes - create quiz
router.post('/', authorize('instructor'), createQuiz);

// Instructor routes - delete quiz
router.delete('/:id', authorize('instructor'), deleteQuiz);

// Instructor routes - get all my quizzes
router.get('/my-quizzes/list', authorize('instructor'), getMyQuizzes);

// Instructor routes - get all attempts for a quiz
router.get('/:quizId/attempts', authorize('instructor'), getQuizAttempts);

module.exports = router;
