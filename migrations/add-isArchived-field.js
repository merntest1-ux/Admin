const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function migrateUsers() {
  try {
    console.log('🔄 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    console.log('🔄 Adding isArchived field to all users...');
    const result = await User.updateMany(
      { isArchived: { $exists: false } },
      { $set: { isArchived: false } }
    );

    console.log(`✅ Migration complete: ${result.modifiedCount} users updated`);
    console.log(`📊 Total users checked: ${result.matchedCount}`);
    
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateUsers();