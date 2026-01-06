// utils/sendEmail.js - Universal version (supports Gmail, Brevo, etc.)
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

    // Use custom SMTP settings from .env, or default to Gmail
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const isSecure = smtpPort === 465; // Only use secure:true for port 465

    // Debug logs
    console.log("📧 Attempting to send email to:", to);
    console.log("📧 Using SMTP HOST:", smtpHost);
    console.log("📧 Using SMTP PORT:", smtpPort);
    console.log("📧 Using EMAIL_USER:", process.env.EMAIL_USER);
    console.log("📧 EMAIL_PASS configured:", !!process.env.EMAIL_PASS);

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000,
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
    console.log("📬 Response:", info.response);
    return { success: true, info };

  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    console.error("❌ Full error:", error);
    
    // Return specific error messages
    if (error.message.includes("Invalid login") || error.message.includes("authentication")) {
      return { 
        success: false, 
        error: "Invalid email credentials. Check EMAIL_USER and EMAIL_PASS." 
      };
    }
    
    if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
      return { 
        success: false, 
        error: "Connection timeout. Your network may be blocking SMTP. Try port 2525 or use mobile hotspot." 
      };
    }

    if (error.message.includes("ECONNREFUSED")) {
      return { 
        success: false, 
        error: "Connection refused. Check SMTP_HOST and SMTP_PORT settings." 
      };
    }
    
    return { 
      success: false, 
      error: error.message 
    };
  }
}

module.exports = sendEmail;
