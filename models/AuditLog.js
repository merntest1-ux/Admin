
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['created', 'updated', 'deleted'],
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  studentName: String,
  studentId: String,
  referralId: String,
  description: {
    type: String,
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed // Stores field changes as {fieldName: {old: value, new: value}}
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  entityType: {
    type: String,
    default: 'referral'
  },
  entityId: mongoose.Schema.Types.ObjectId
});

// Create indexes for better query performance
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ referralId: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
