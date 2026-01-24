// routes/activityLogs.js (MongoDB Version)
const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const { auth, authorizeRoles } = require('../middleware/auth');

/**
 * GET /api/activity-logs
 * Get all activity logs (Admin and Counselor only)
 */
router.get('/', auth, authorizeRoles('Admin', 'Counselor'), async (req, res) => {
  try {
    const {
      action,
      entityType,
      userId,
      startDate,
      endDate,
      search,
      limit = 100,
      offset = 0
    } = req.query;

    let filter = {};

    // Apply filters
    if (action) {
      filter.action = action;
    }

    if (entityType) {
      filter.entityType = entityType;
    }

    if (userId) {
      filter.user = userId;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { studentName: { $regex: search, $options: 'i' } },
        { referralId: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await ActivityLog.find(filter)
      .populate('user', 'username fullName role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await ActivityLog.countDocuments(filter);

    // Format response with both field names for frontend compatibility
    const formattedLogs = logs.map(log => ({
      id: log._id,
      user_id: log.user?._id,
      user_name: log.userName,
      userName: log.userName,
      action: log.action,
      entity_type: log.entityType,
      entityType: log.entityType,
      entity_id: log.entityId,
      entityId: log.entityId,
      student_name: log.studentName,
      studentName: log.studentName,
      referral_id: log.referralId,
      referralId: log.referralId,
      description: log.description,
      changes: log.changes,
      ip_address: log.ipAddress,
      ipAddress: log.ipAddress,
      user_agent: log.userAgent,
      userAgent: log.userAgent,
      timestamp: log.createdAt,
      createdAt: log.createdAt
    }));

    res.json({
      success: true,
      data: formattedLogs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + logs.length < total
      }
    });
  } catch (error) {
    console.error('❌ Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
});

/**
 * GET /api/activity-logs/stats
 * Get activity statistics
 */
router.get('/stats', auth, authorizeRoles('Admin', 'Counselor'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        dateFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.createdAt.$lte = new Date(endDate);
      }
    }

    // Get action counts
    const actionStats = await ActivityLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $project: { action: '$_id', count: 1, _id: 0 } }
    ]);

    // Get entity type counts
    const entityStats = await ActivityLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$entityType', count: { $sum: 1 } } },
      { $project: { entity_type: '$_id', count: 1, _id: 0 } }
    ]);

    // Get most active users
    const activeUsers = await ActivityLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$userName', activity_count: { $sum: 1 } } },
      { $project: { user_name: '$_id', activity_count: 1, _id: 0 } },
      { $sort: { activity_count: -1 } },
      { $limit: 5 }
    ]);

    // Get recent activity trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyActivity = await ActivityLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $project: { date: '$_id', count: 1, _id: 0 } },
      { $sort: { date: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        actionStats,
        entityStats,
        activeUsers,
        dailyActivity
      }
    });
  } catch (error) {
    console.error('❌ Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity statistics',
      error: error.message
    });
  }
});

/**
 * GET /api/activity-logs/my-activity
 * Get current user's activity logs
 */
router.get('/my-activity', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 50, offset = 0 } = req.query;

    const logs = await ActivityLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const formattedLogs = logs.map(log => ({
      id: log._id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      studentName: log.studentName,
      referralId: log.referralId,
      description: log.description,
      changes: log.changes,
      timestamp: log.createdAt
    }));

    res.json({
      success: true,
      data: formattedLogs
    });
  } catch (error) {
    console.error('❌ Error fetching user activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
});

/**
 * DELETE /api/activity-logs/old
 * Delete logs older than specified days (Admin only)
 */
router.delete('/old', auth, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { days = 90 } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const result = await ActivityLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} old activity logs`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error deleting old logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete old logs',
      error: error.message
    });
  }
});

module.exports = router;
