// utils/sendEmail.js - Brevo API version (no SMTP, uses HTTPS)
const https = require('https');

async function sendEmail({ to, subject, text }) {
  try {
    // Check if using Brevo API or SMTP
    const useBrevoAPI = process.env.BREVO_API_KEY;
    
    if (useBrevoAPI) {
      // Use Brevo API (recommended for Render)
      return await sendViaBrevoAPI({ to, subject, text });
    } else {
      // Fall back to SMTP
      return await sendViaSMTP({ to, subject, text });
    }
  } catch (error) {
    console.error("❌ Error in sendEmail:", error);
    return { success: false, error: error.message };
  }
}

// Brevo API Method (Works on Render - uses HTTPS)
async function sendViaBrevoAPI({ to, subject, text }) {
  console.log("📧 Using Brevo API (HTTPS)");
  
  if (!process.env.BREVO_API_KEY) {
    return { 
      success: false, 
      error: "BREVO_API_KEY not configured" 
    };
  }

  const data = JSON.stringify({
    sender: {
      name: "CSCQC System",
      email: process.env.EMAIL_USER || "noreply@yourdomain.com"
    },
    to: [{ email: to }],
    subject: subject,
    textContent: text
  });

  const options = {
    hostname: 'api.brevo.com',
    port: 443,
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("✅ Email sent via Brevo API");
          console.log("Response:", responseData);
          resolve({ success: true, response: responseData });
        } else {
          console.error("❌ Brevo API error:", res.statusCode, responseData);
          resolve({ 
            success: false, 
            error: `Brevo API error: ${res.statusCode}`,
            details: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error("❌ Brevo API request failed:", error);
      resolve({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

// SMTP Method (fallback)
async function sendViaSMTP({ to, subject, text }) {
  console.log("📧 Using SMTP");
  
  const nodemailer = require("nodemailer");
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return { 
      success: false, 
      error: "EMAIL_USER and EMAIL_PASS not configured" 
    };
  }

  const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const isSecure = smtpPort === 465;

  console.log("📧 SMTP HOST:", smtpHost);
  console.log("📧 SMTP PORT:", smtpPort);
  console.log("📧 EMAIL_USER:", process.env.EMAIL_USER);

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: isSecure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: isSecure,
      minVersion: 'TLSv1.2'
    },
    requireTLS: !isSecure,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });

  try {
    console.log("🔍 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified");
  } catch (verifyError) {
    console.error("❌ SMTP verification failed:", verifyError.message);
  }

  const mailOptions = {
    from: `CSCQC System <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent via SMTP:", info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error("❌ SMTP send failed:", error.message);
    
    if (error.message.includes("timeout")) {
      return { 
        success: false, 
        error: "SMTP timeout. Try using BREVO_API_KEY instead of SMTP." 
      };
    }
    
    return { success: false, error: error.message };
  }
}

module.exports = sendEmail;
