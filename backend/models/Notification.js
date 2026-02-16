const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['task_assigned', 'task_updated'],
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Creates createdAt automatically
});

notificationSchema.index({ userId: 1 });
notificationSchema.index({ read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
