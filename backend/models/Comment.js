const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  commentText: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true // Creates createdAt automatically
});

commentSchema.index({ taskId: 1 });

module.exports = mongoose.model('Comment', commentSchema);
