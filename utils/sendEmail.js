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
    console.log("📧 Secure mode:", isSecure);

    // Create transporter with better TLS settings
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      // Better TLS configuration
      tls: {
        // Only reject unauthorized for secure connections
        rejectUnauthorized: isSecure,
        // Minimum TLS version
        minVersion: 'TLSv1.2'
      },
      // Enable STARTTLS for port 587
      requireTLS: !isSecure,
      // Connection timeouts
      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
      // Add logger for debugging
      logger: process.env.NODE_ENV === 'development',
      debug: process.env.NODE_ENV === 'development'
    });

    // Verify connection configuration
    console.log("🔍 Verifying SMTP connection...");
    try {
      await transporter.verify();
      console.log("✅ SMTP connection verified");
    } catch (verifyError) {
      console.error("❌ SMTP verification failed:", verifyError.message);
      // Continue anyway, as verify() can sometimes fail even when sending works
    }

    const mailOptions = {
      from: CSCQC System <${process.env.EMAIL_USER}>,
      to,
      subject,
      text,
    };

    console.log("📤 Sending email...");
    const info = await transporter.sendMail(mailOptions);
    
    console.log("✅ Email sent successfully:", info.messageId);
    console.log("📬 Response:", info.response);
    console.log("📬 Accepted:", info.accepted);
    console.log("📬 Rejected:", info.rejected);
    
    return { success: true, info };
    
  } catch (error) {
    // Enhanced error logging
    console.error("❌ Error sending email:", error.message);
    console.error("❌ Error code:", error.code);
    console.error("❌ Error command:", error.command);
    console.error("❌ Full error:", error);
    
    // Return specific error messages
    if (error.message.includes("Invalid login") || 
        error.message.includes("authentication") ||
        error.code === 'EAUTH') {
      return { 
        success: false, 
        error: "Invalid email credentials. Check EMAIL_USER and EMAIL_PASS." 
      };
    }
    
    if (error.message.includes("timeout") || 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ESOCKET') {
      return { 
        success: false, 
        error: "Connection timeout. Your network may be blocking SMTP. Try port 2525 or use mobile hotspot." 
      };
    }
    
    if (error.code === 'ECONNREFUSED') {
      return { 
        success: false, 
        error: "Connection refused. Check SMTP_HOST and SMTP_PORT settings." 
      };
    }

    if (error.code === 'ENOTFOUND') {
      return {
        success: false,
        error: SMTP host not found: ${error.hostname}. Check SMTP_HOST setting.
      };
    }
    
    return { 
      success: false, 
      error: error.message,
      code: error.code
    };
  }
}

module.exports = sendEmail;
