// models/ActivityLog.js
const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: ['created', 'updated', 'deleted', 'viewed', 'exported', 'login', 'logout'],
    index: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['referral', 'student', 'user', 'category', 'submission', 'system'],
    index: true
  },
  entityId: {
    type: String,
    default: null
  },
  studentName: {
    type: String,
    default: null,
    index: true
  },
  referralId: {
    type: String,
    default: null,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true  // Automatically creates createdAt and updatedAt
});

// Index for efficient querying
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, action: 1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
