const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

/**
 * Get all active quizzes available for students
 * GET /api/quizzes/available
 */
exports.getAvailableQuizzes = async (req, res) => {
  try {
    // Get all active quizzes (excluding deleted ones)
    const quizzes = await Quiz.find({ isActive: true })
      .select('title timeLimit totalPoints questions createdAt')
      .populate('instructor', 'username')
      .sort({ createdAt: -1 });

    // For students, exclude quizzes they've already attempted
    if (req.user.role === 'student') {
      const attemptedQuizIds = await QuizAttempt.find({
        student: req.user.id
      }).distinct('quiz');

      const availableQuizzes = quizzes.filter(
        quiz => !attemptedQuizIds.some(
          attemptedId => attemptedId.toString() === quiz._id.toString()
        )
      );

      return res.status(200).json({
        success: true,
        data: availableQuizzes
      });
    }

    // For instructors, return all quizzes
    res.status(200).json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get single quiz by ID
 * GET /api/quizzes/:id
 */
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // If user is an instructor and owns the quiz, allow viewing even if deleted
    const isInstructor = req.user.role === 'instructor';
    const isOwner = quiz.instructor.toString() === req.user.id.toString();
    
    if (isInstructor && isOwner) {
      // Instructor can view their own quiz regardless of isActive status
      return res.status(200).json({
        success: true,
        data: quiz
      });
    }

    // For students or other instructors, check if quiz is active (not deleted)
    if (!quiz.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Quiz no longer exists'
      });
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Create new quiz (Instructor only)
 * POST /api/quizzes
 */
exports.createQuiz = async (req, res) => {
  try {
    const { title, timeLimit, questions } = req.body;

    // Validate input
    if (!title || !timeLimit || !questions) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, timeLimit, and questions'
      });
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions have been added'
      });
    }

    if (timeLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Time limit must be greater than zero'
      });
    }

    // Validate questions structure
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      
      // Check if questionText exists and is not empty
      if (!q.questionText || typeof q.questionText !== 'string' || q.questionText.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} is missing question text`
        });
      }
      
      // Check if options exists and is an array
      if (!q.options || !Array.isArray(q.options)) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} is missing options array`
        });
      }
      
      // Check if options has valid length
      if (q.options.length < 2 || q.options.length > 6) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} must have between 2 and 6 options`
        });
      }
      
      // Check if all options have text
      const emptyOptions = q.options.filter(opt => !opt || typeof opt !== 'string' || opt.trim().length === 0);
      if (emptyOptions.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} has empty options`
        });
      }
      
      // Check if correctAnswer is a number (including 0)
      if (q.correctAnswer === undefined || q.correctAnswer === null || typeof q.correctAnswer !== 'number') {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} is missing correct answer`
        });
      }
      
      // Check if correctAnswer is a valid index
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1} has invalid correct answer index`
        });
      }
    }

    const quiz = await Quiz.create({
      title,
      timeLimit,
      questions,
      instructor: req.user.id
    });

    res.status(201).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Delete quiz (Instructor only)
 * DELETE /api/quizzes/:id
 */
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user is the instructor who created the quiz
    if (quiz.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this quiz'
      });
    }

    // Soft delete by setting isActive to false
    quiz.isActive = false;
    await quiz.save();

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Submit quiz attempt
 * POST /api/quizzes/:id/submit
 */
exports.submitQuiz = async (req, res) => {
  try {
    const { answers, timeTaken } = req.body;
    const quizId = req.params.id;
    const studentId = req.user.id;

    // Get the quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz || !quiz.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Quiz no longer exists'
      });
    }

    // Check if student has already attempted this quiz
    const existingAttempt = await QuizAttempt.findOne({
      student: studentId,
      quiz: quizId
    });

    if (existingAttempt) {
      return res.status(400).json({
        success: false,
        message: 'You have already attempted this quiz. Each quiz can only be taken once.'
      });
    }

    // Calculate score
    let score = 0;
    let totalPoints = 0;
    const detailedAnswers = [];

    quiz.questions.forEach((question, index) => {
      totalPoints += question.points || 1;
      const userAnswer = answers[index];
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        score += question.points || 1;
      }

      detailedAnswers.push({
        questionId: index,
        selectedAnswer: userAnswer,
        isCorrect: isCorrect
      });
    });

    // Create quiz attempt
    const attempt = await QuizAttempt.create({
      student: studentId,
      quiz: quizId,
      answers: detailedAnswers,
      score,
      totalPoints,
      timeTaken: timeTaken || 0
    });

    res.status(201).json({
      success: true,
      data: attempt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get student's quiz attempts
 * GET /api/quizzes/attempts/my
 */
exports.getMyAttempts = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ student: req.user.id })
      .populate('quiz', 'title timeLimit totalPoints')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      data: attempts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get a specific quiz attempt
 * GET /api/quizzes/attempts/:attemptId
 */
exports.getAttempt = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.attemptId)
      .populate('quiz')
      .populate('student', 'username');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: 'Attempt not found'
      });
    }

    // Only allow student who made the attempt or instructor to view
    if (attempt.student._id.toString() !== req.user.id && req.user.role !== 'instructor') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this attempt'
      });
    }

    res.status(200).json({
      success: true,
      data: attempt
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all quiz attempts by quiz (Instructor only)
 * GET /api/quizzes/:quizId/attempts
 */
exports.getQuizAttempts = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Check if user is the instructor who created the quiz
    if (quiz.instructor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view results for this quiz'
      });
    }

    const attempts = await QuizAttempt.find({ quiz: req.params.quizId })
      .populate('student', 'username')
      .sort({ submittedAt: -1 });

    // Calculate statistics
    const submittedCount = attempts.length;
    
    // Calculate average from valid scores only
    // Calculate percentage for each attempt if missing or recalculate if totalPoints > 0
    const validPercentages = [];
    
    attempts.forEach(attempt => {
      // Calculate percentage if missing or recalculate to ensure accuracy
      let percentage = 0;
      if (attempt.totalPoints > 0) {
        percentage = (attempt.score / attempt.totalPoints) * 100;
      } else if (attempt.percentage !== null && attempt.percentage !== undefined) {
        percentage = attempt.percentage;
      }
      
      // Only include if it's a valid number (including 0)
      if (!isNaN(percentage) && isFinite(percentage)) {
        validPercentages.push(percentage);
      }
    });
    
    const sumOfValidScores = validPercentages.reduce((sum, score) => sum + score, 0);
    const averageScore = validPercentages.length > 0 
      ? parseFloat((sumOfValidScores / validPercentages.length).toFixed(2))
      : 0;

    // Calculate score buckets (0-9, 10-19, ..., 90-100)
    const scoreBuckets = {};
    for (let i = 0; i <= 100; i += 10) {
      const bucketLabel = i === 100 ? '90-100' : `${i}-${i + 9}`;
      scoreBuckets[bucketLabel] = 0;
    }

    // Count students in each score bucket
    attempts.forEach(attempt => {
      // Calculate percentage if missing
      let percentage = 0;
      if (attempt.totalPoints > 0) {
        percentage = (attempt.score / attempt.totalPoints) * 100;
      } else if (attempt.percentage !== null && attempt.percentage !== undefined) {
        percentage = attempt.percentage;
      }
      
      // Ensure percentage is a valid number
      if (isNaN(percentage) || !isFinite(percentage)) {
        percentage = 0;
      }
      
      // Clamp percentage to 0-100 range
      percentage = Math.max(0, Math.min(100, percentage));
      
      let bucketKey;
      if (percentage >= 90) {
        bucketKey = '90-100';
      } else {
        const lowerBound = Math.floor(percentage / 10) * 10;
        bucketKey = `${lowerBound}-${lowerBound + 9}`;
      }
      
      if (scoreBuckets.hasOwnProperty(bucketKey)) {
        scoreBuckets[bucketKey]++;
      }
    });

    res.status(200).json({
      success: true,
      data: attempts,
      statistics: {
        submittedCount,
        averageScore,
        scoreBuckets
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get all quizzes created by instructor
 * GET /api/quizzes/my-quizzes
 */
exports.getMyQuizzes = async (req, res) => {
  try {
    // Only get active quizzes (exclude deleted ones)
    const quizzes = await Quiz.find({ 
      instructor: req.user.id,
      isActive: true 
    })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
