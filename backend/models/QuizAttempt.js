const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  answers: [{
    questionId: Number,
    selectedAnswer: Number,
    isCorrect: Boolean
  }],
  score: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  grade: {
    type: String,
    default: 'F'
  },
  timeTaken: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

attemptSchema.pre('save', function(next) {
  this.percentage = this.totalPoints > 0 ? (this.score / this.totalPoints) * 100 : 0;
  
  // Grading scale: S, A, B, C, D, E, P, F
  if (this.percentage >= 90) this.grade = 'S';      // Superior/Excellent (90-100%)
  else if (this.percentage >= 80) this.grade = 'A'; // Excellent (80-89%)
  else if (this.percentage >= 70) this.grade = 'B'; // Good (70-79%)
  else if (this.percentage >= 60) this.grade = 'C'; // Satisfactory (60-69%)
  else if (this.percentage >= 50) this.grade = 'D';  // Pass (50-59%)
  else if (this.percentage >= 40) this.grade = 'E'; // Needs Improvement (40-49%)
  else if (this.percentage >= 35) this.grade = 'P'; // Passing but very low (35-39%)
  else this.grade = 'F';                             // Fail (Below 35%)
  
  next();
});

module.exports = mongoose.model('QuizAttempt', attemptSchema);