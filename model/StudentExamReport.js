import mongoose from 'mongoose';

const studentExamSchema = new mongoose.Schema(
  {
    // Reference to the specific exam inside Batch.exams
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, 
    },

    examCode: {
      type: String,
      required: true,
      trim: true,
    },

    // Reference to the student
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Students',
      required: true,
    },

    // Answers and review status for each question
    answerDetails: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          // No ref here unless you break out Questions into a separate model
        },
        selectedOption: String,
        isCorrect: Boolean,
        markedForReview: Boolean,
      },
    ],

    totalQuestions: Number,
    attemptedQuestions: Number,
    unansweredQuestions: Number,
    correctAnswers: Number,
    wrongAnswers: Number,
    reviewedQuestionsCount: Number,

    result: Number, // Percent score

    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },

    startTime: Date,
    endTime: Date,
    durationInMinutes: Number,

    autoSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ Virtual field to compute total time taken
studentExamSchema.virtual('timeTakenInSeconds').get(function () {
  if (this.startTime && this.endTime) {
    return Math.floor((this.endTime - this.startTime) / 1000);
  }
  return null;
});

const StudentExamReport = mongoose.model('StudentExamReport', studentExamSchema);

export default StudentExamReport;
