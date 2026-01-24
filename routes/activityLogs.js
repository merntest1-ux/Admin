// routes/activityLogs.js
const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const pool = require('../config/database');

/**
 * GET /api/activity-logs
 * Get all activity logs (Admin and Counselor only)
 */
router.get('/', authenticateToken, authorizeRoles('admin', 'counselor'), async (req, res) => {
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

    let query = `
      SELECT 
        id,
        user_id,
        user_name,
        action,
        entity_type,
        entity_id,
        student_name,
        referral_id,
        description,
        changes,
        ip_address,
        user_agent,
        timestamp
      FROM activity_logs
      WHERE 1=1
    `;
    const params = [];

    // Apply filters
    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    if (entityType) {
      query += ' AND entity_type = ?';
      params.push(entityType);
    }

    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate);
    }

    if (search) {
      query += ` AND (
        user_name LIKE ? OR
        student_name LIKE ? OR
        referral_id LIKE ? OR
        description LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Order by most recent first
    query += ' ORDER BY timestamp DESC';

    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [logs] = await pool.query(query, params);

    // Parse JSON changes field
    const processedLogs = logs.map(log => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null
    }));

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM activity_logs WHERE 1=1';
    const countParams = [];

    if (action) {
      countQuery += ' AND action = ?';
      countParams.push(action);
    }
    if (entityType) {
      countQuery += ' AND entity_type = ?';
      countParams.push(entityType);
    }
    if (userId) {
      countQuery += ' AND user_id = ?';
      countParams.push(userId);
    }
    if (startDate) {
      countQuery += ' AND timestamp >= ?';
      countParams.push(startDate);
    }
    if (endDate) {
      countQuery += ' AND timestamp <= ?';
      countParams.push(endDate);
    }
    if (search) {
      countQuery += ` AND (
        user_name LIKE ? OR
        student_name LIKE ? OR
        referral_id LIKE ? OR
        description LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      success: true,
      data: processedLogs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + processedLogs.length < total
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
router.get('/stats', authenticateToken, authorizeRoles('admin', 'counselor'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [];

    if (startDate) {
      dateFilter += ' AND timestamp >= ?';
      params.push(startDate);
    }
    if (endDate) {
      dateFilter += ' AND timestamp <= ?';
      params.push(endDate);
    }

    // Get action counts
    const [actionStats] = await pool.query(
      `SELECT action, COUNT(*) as count 
       FROM activity_logs 
       WHERE 1=1 ${dateFilter}
       GROUP BY action`,
      params
    );

    // Get entity type counts
    const [entityStats] = await pool.query(
      `SELECT entity_type, COUNT(*) as count 
       FROM activity_logs 
       WHERE 1=1 ${dateFilter}
       GROUP BY entity_type`,
      params
    );

    // Get most active users
    const [activeUsers] = await pool.query(
      `SELECT user_name, COUNT(*) as activity_count 
       FROM activity_logs 
       WHERE 1=1 ${dateFilter}
       GROUP BY user_name 
       ORDER BY activity_count DESC 
       LIMIT 5`,
      params
    );

    // Get recent activity trend (last 7 days)
    const [dailyActivity] = await pool.query(
      `SELECT DATE(timestamp) as date, COUNT(*) as count 
       FROM activity_logs 
       WHERE timestamp >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(timestamp) 
       ORDER BY date DESC`
    );

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
router.get('/my-activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const [logs] = await pool.query(
      `SELECT 
        id, action, entity_type, entity_id, student_name, referral_id,
        description, changes, timestamp
       FROM activity_logs
       WHERE user_id = ?
       ORDER BY timestamp DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    const processedLogs = logs.map(log => ({
      ...log,
      changes: log.changes ? JSON.parse(log.changes) : null
    }));

    res.json({
      success: true,
      data: processedLogs
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
router.delete('/old', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { days = 90 } = req.query;

    const [result] = await pool.query(
      'DELETE FROM activity_logs WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [parseInt(days)]
    );

    res.json({
      success: true,
      message: `Deleted ${result.affectedRows} old activity logs`,
      deletedCount: result.affectedRows
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
