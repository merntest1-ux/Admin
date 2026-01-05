// utils/sendEmail.js - Improved version with timeout
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

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // Use TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Verify transporter configuration (optional, but helpful for debugging)
    try {
      await transporter.verify();
      console.log("✅ Email transporter verified");
    } catch (verifyError) {
      console.error("❌ Email transporter verification failed:", verifyError.message);
      return { 
        success: false, 
        error: "Email configuration invalid" 
      };
    }

    const mailOptions = {
      from: `CSCQC System <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Email send timeout")), 15000); // 15 seconds
    });

    const sendPromise = transporter.sendMail(mailOptions);

    const info = await Promise.race([sendPromise, timeoutPromise]);
    
    console.log("✅ Email sent successfully:", info.messageId);
    return { success: true, info };

  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    
    // Return specific error messages
    if (error.message.includes("Invalid login")) {
      return { 
        success: false, 
        error: "Invalid email credentials. Check EMAIL_USER and EMAIL_PASS." 
      };
    }
    
    return { 
      success: false, 
      error: error.message 
    };
  }
}

module.exports = sendEmail;

