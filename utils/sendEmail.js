// utils/sendEmail.js - Fixed version for Gmail
const nodemailer = require("nodemailer");

async function sendEmail({ to, subject, text }) {
  try {
    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email credentials not configured");
      return { 
        success: false, 
        error: "Email credentials not configured" 
      };
    }

    // Debug logs (remove after testing)
    console.log("📧 Attempting to send email to:", to);
    console.log("📧 Using EMAIL_USER:", process.env.EMAIL_USER);
    console.log("📧 EMAIL_PASS configured:", !!process.env.EMAIL_PASS);

    // Create transporter with Gmail SMTP settings
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use STARTTLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 30000,
      socketTimeout: 30000,
    });

    const mailOptions = {
      from: `CSCQC System <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    console.log("📤 Sending email...");
    const info = await transporter.sendMail(mailOptions);
    
    console.log("✅ Email sent successfully:", info.messageId);
    return { success: true, info };

  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    console.error("Full error:", error);
    
    // Return specific error messages
    if (error.message.includes("Invalid login")) {
      return { 
        success: false, 
        error: "Invalid email credentials. Check EMAIL_USER and EMAIL_PASS." 
      };
    }
    
    if (error.message.includes("timeout")) {
      return { 
        success: false, 
        error: "Email server connection timeout. Check your network/firewall." 
      };
    }
    
    return { 
      success: false, 
      error: error.message 
    };
  }
}

module.exports = sendEmail;
