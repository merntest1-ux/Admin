// middleware/activityLogger.js (MongoDB Version)
const ActivityLog = require('../models/ActivityLog');

/**
 * Log activity to MongoDB
 * @param {Object} params - Activity parameters
 * @param {string} params.userId - ID of user performing action (MongoDB ObjectId)
 * @param {string} params.userName - Full name of user
 * @param {string} params.action - Action type: 'created', 'updated', 'deleted', 'viewed', 'exported', 'login', 'logout'
 * @param {string} params.entityType - Entity type: 'referral', 'student', 'user', 'category', 'submission', 'system'
 * @param {string} [params.entityId] - ID of entity being acted upon
 * @param {string} [params.studentName] - Name of student (if applicable)
 * @param {string} [params.referralId] - Referral ID (if applicable)
 * @param {string} params.description - Human-readable description
 * @param {Object} [params.changes] - Object containing old/new values
 * @param {Object} params.req - Express request object
 */
async function logActivity({
  userId,
  userName,
  action,
  entityType,
  entityId = null,
  studentName = null,
  referralId = null,
  description,
  changes = null,
  req
}) {
  try {
    // Get IP address
    const ipAddress = req?.ip || 
                     req?.connection?.remoteAddress || 
                     req?.headers['x-forwarded-for']?.split(',')[0] || 
                     null;
    
    // Get user agent
    const userAgent = req?.get('user-agent') || null;

    const activityLog = new ActivityLog({
      user: userId,
      userName,
      action,
      entityType,
      entityId,
      studentName,
      referralId,
      description,
      changes,
      ipAddress,
      userAgent
    });

    await activityLog.save();

    console.log(`📝 Activity logged: ${action} ${entityType} by ${userName}`);
  } catch (error) {
    console.error('❌ Failed to log activity:', error);
    // Don't throw - logging failures shouldn't break the main operation
  }
}

module.exports = { logActivity };
