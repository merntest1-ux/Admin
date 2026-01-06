// controllers/userController.js
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// SANDBOX MODE - Send test emails to YOUR email only
const TEST_EMAIL = process.env.TEST_EMAIL || "merntest@gmail.com"; // CHANGE THIS

// ---------------- Get all users ----------------
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Create user ----------------
exports.createUser = async (req, res) => {
  try {
    const { fullName, username, email, role, department, password, requirePasswordChange } = req.body;

    console.log('📝 Creating user with email:', email);

    // Check duplicates case-insensitively
    const existingEmail = await User.findOne({ email: { $regex: `^${email}$`, $options: 'i' } });
    if (existingEmail) return res.status(400).json({ success: false, message: 'Email already exists' });

    const existingUsername = await User.findOne({ username: { $regex: `^${username}$`, $options: 'i' } });
    if (existingUsername) return res.status(400).json({ success: false, message: 'Username already exists' });

    const newUser = new User({
      fullName,
      username,
      email,
      role,
      department,
      password, // raw password, hashed by pre-save hook
      requirePasswordChange,
      isActive: true
    });

    await newUser.save();
    console.log('✅ User saved to database');

    // Send email with temporary password
    console.log('📧 Attempting to send welcome email...');
    const emailResult = await sendEmail({
      to: TEST_EMAIL,  // 🔧 CHANGED: Send to your email for testing
      subject: 'Your Account Has Been Created',
      text: `Hello ${fullName},\n\nYour account has been created.\nUsername: ${username}\nTemporary Password: ${password}\n\nPlease log in and change your password immediately.\n\nCSCQC Guidance System`
    });

    console.log('📧 Email result:', JSON.stringify(emailResult, null, 2));

    // Check if email was sent successfully
    if (!emailResult.success) {
      console.error('❌ Email failed:', emailResult.error);
      return res.status(201).json({ 
        success: true, 
        warning: true,
        message: 'User created, but failed to send email: ' + emailResult.error, 
        data: newUser 
      });
    }

    console.log('✅ Welcome email sent successfully');
    res.status(201).json({ 
      success: true, 
      message: 'User created and welcome email sent successfully', 
      data: newUser 
    });

  } catch (error) {
    console.error('❌ Error in createUser:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Toggle user status ----------------
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Reset password ----------------
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = newPassword; // hashed by pre-save hook
    user.requirePasswordChange = true;
    await user.save();
    
    console.log('✅ Password reset in database');
    console.log('📧 Attempting to send password reset email...');

    const emailResult = await sendEmail({
      to: TEST_EMAIL,  // 🔧 CHANGED: Send to your email for testing
      subject: 'Your Password Has Been Reset',
      text: `Hello ${user.fullName},\n\nYour password has been reset.\nTemporary Password: ${newPassword}\n\nPlease log in and change your password immediately.\n\nCSCQC Guidance System`
    });

    console.log('📧 Email result:', JSON.stringify(emailResult, null, 2));

    if (!emailResult.success) {
      console.error('❌ Email failed:', emailResult.error);
      return res.json({ 
        success: true, 
        warning: true,
        message: 'Password reset, but failed to send email: ' + emailResult.error
      });
    }

    console.log('✅ Password reset email sent successfully');
    res.json({ success: true, message: 'Password reset and notification email sent successfully' });
  } catch (error) {
    console.error('❌ Error in resetPassword:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ---------------- Delete user ----------------
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
