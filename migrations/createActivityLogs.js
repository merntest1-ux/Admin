// migrations/createActivityLogs.js
// Run this migration to create the activity_logs table

const pool = require('../config/database');

async function createActivityLogsTable() {
  try {
    console.log('📋 Creating activity_logs table...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        action ENUM('created', 'updated', 'deleted', 'viewed', 'exported', 'login', 'logout') NOT NULL,
        entity_type ENUM('referral', 'student', 'user', 'category', 'submission', 'system') NOT NULL,
        entity_id INT NULL,
        student_name VARCHAR(255) NULL,
        referral_id VARCHAR(50) NULL,
        description TEXT NOT NULL,
        changes JSON NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_entity_type (entity_type),
        INDEX idx_timestamp (timestamp),
        INDEX idx_student_name (student_name),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ activity_logs table created successfully!');
    console.log('📊 Indexes created for optimal query performance');
    
  } catch (error) {
    console.error('❌ Error creating activity_logs table:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  createActivityLogsTable()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createActivityLogsTable };
