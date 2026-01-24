const AuditLog = require('../models/AuditLog');

class ActivityLogger {
  /**
   * Log an activity to the database
   */
  static async logActivity(logData) {
    try {
      const audit = new AuditLog({
        action: logData.action,
        userName: logData.userName,
        userId: logData.userId,
        studentName: logData.studentName || null,
        studentId: logData.studentId || null,
        referralId: logData.referralId || null,
        description: logData.description,
        changes: logData.changes || null,
        ipAddress: logData.ipAddress || null,
        userAgent: logData.userAgent || null,
        timestamp: new Date(),
        entityType: logData.entityType || 'referral',
        entityId: logData.entityId || null
      });

      await audit.save();
      console.log('✅ Activity logged:', logData.description);
      return audit;
    } catch (error) {
      console.error('❌ Error logging activity:', error);
      // Don't throw - logging failures shouldn't break main operations
    }
  }

  /**
   * Extract changes between old and new objects
   */
  static getChanges(oldData, newData, fieldsToTrack) {
    const changes = {};
    
    fieldsToTrack.forEach(field => {
      const oldValue = oldData[field];
      const newValue = newData[field];
      
      // Only track if values actually changed
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[field] = {
          old: oldValue || 'N/A',
          new: newValue || 'N/A'
        };
      }
    });

    return Object.keys(changes).length > 0 ? changes : null;
  }

  /**
   * Log referral creation
   */
  static async logReferralCreated(referral, user, req) {
    await this.logActivity({
      action: 'created',
      userName: user.fullName || user.username,
      userId: user._id,
      studentName: referral.studentName,
      studentId: referral.studentId,
      referralId: referral.referralId,
      description: `New referral created for ${referral.studentName}`,
      ipAddress: this.getClientIp(req),
      userAgent: req.get('user-agent'),
      entityType: 'referral',
      entityId: referral._id
    });
  }

  /**
   * Log referral update
   */
  static async logReferralUpdated(oldReferral, newReferral, user, req) {
    const fieldsToTrack = [
      'status',
      'severity',
      'urgency',
      'category',
      'reason',
      'description',
      'notes',
      'studentName',
      'studentId',
      'level',
      'grade',
      'referredBy',
      'adviser'
    ];

    const changes = this.getChanges(oldReferral, newReferral, fieldsToTrack);

    await this.logActivity({
      action: 'updated',
      userName: user.fullName || user.username,
      userId: user._id,
      studentName: newReferral.studentName,
      studentId: newReferral.studentId,
      referralId: newReferral.referralId,
      description: `Referral updated for ${newReferral.studentName}`,
      changes: changes,
      ipAddress: this.getClientIp(req),
      userAgent: req.get('user-agent'),
      entityType: 'referral',
      entityId: newReferral._id
    });
  }

  /**
   * Log referral deletion
   */
  static async logReferralDeleted(referral, user, req) {
    await this.logActivity({
      action: 'deleted',
      userName: user.fullName || user.username,
      userId: user._id,
      studentName: referral.studentName,
      studentId: referral.studentId,
      referralId: referral.referralId,
      description: `Referral deleted for ${referral.studentName}`,
      ipAddress: this.getClientIp(req),
      userAgent: req.get('user-agent'),
      entityType: 'referral',
      entityId: referral._id
    });
  }

  /**
   * Get client IP address
   */
  static getClientIp(req) {
    return (
      req.headers['x-forwarded-for']?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      req.connection.remoteAddress ||
      'Unknown'
    );
  }
}

module.exports = ActivityLogger;
