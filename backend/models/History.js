const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
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
  action: {
    type: String,
    enum: ['CREATED', 'STATUS_CHANGED', 'TITLE_CHANGED', 'DELETED'],
    required: true
  },
  oldValue: {
    type: String,
    default: ''
  },
  newValue: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

historySchema.index({ taskId: 1 });
historySchema.index({ timestamp: -1 });

module.exports = mongoose.model('History', historySchema);
