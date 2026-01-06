// utils/sendEmail.js - Multi-provider support (Resend, SendGrid, Brevo, SMTP)
const https = require('https');

async function sendEmail({ to, subject, text }) {
  try {
    // Priority: Resend > SendGrid > Brevo > SMTP
    if (process.env.RESEND_API_KEY) {
      return await sendViaResend({ to, subject, text });
    } else if (process.env.SENDGRID_API_KEY) {
      return await sendViaSendGrid({ to, subject, text });
    } else if (process.env.BREVO_API_KEY) {
      return await sendViaBrevoAPI({ to, subject, text });
    } else {
      return await sendViaSMTP({ to, subject, text });
    }
  } catch (error) {
    console.error("❌ Error in sendEmail:", error);
    return { success: false, error: error.message };
  }
}

// Resend API Method (Recommended - easiest and most reliable)
async function sendViaResend({ to, subject, text }) {
  console.log("📧 Using Resend API (HTTPS)");
  
  if (!process.env.RESEND_API_KEY) {
    return { 
      success: false, 
      error: "RESEND_API_KEY not configured" 
    };
  }

  // Use verified email or Resend's test domain
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const fromName = process.env.RESEND_FROM_NAME || "CSCQC System";

  const data = JSON.stringify({
    from: `${fromName} <${fromEmail}>`,
    to: [to],
    subject: subject,
    text: text
  });

  const options = {
    hostname: 'api.resend.com',
    port: 443,
    path: '/emails',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("✅ Email sent via Resend");
          console.log("📬 Response:", responseData);
          resolve({ success: true, provider: 'resend' });
        } else {
          console.error("❌ Resend error:", res.statusCode, responseData);
          resolve({ 
            success: false, 
            error: `Resend error: ${res.statusCode}`,
            details: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error("❌ Resend request failed:", error);
      resolve({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

// SendGrid API Method
async function sendViaSendGrid({ to, subject, text }) {
  console.log("📧 Using SendGrid API (HTTPS)");
  
  if (!process.env.SENDGRID_API_KEY) {
    return { 
      success: false, 
      error: "SENDGRID_API_KEY not configured" 
    };
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER || "noreply@yourdomain.com";
  const fromName = process.env.SENDGRID_FROM_NAME || "CSCQC System";

  const data = JSON.stringify({
    personalizations: [
      {
        to: [{ email: to }],
        subject: subject
      }
    ],
    from: {
      email: fromEmail,
      name: fromName
    },
    content: [
      {
        type: "text/plain",
        value: text
      }
    ]
  });

  const options = {
    hostname: 'api.sendgrid.com',
    port: 443,
    path: '/v3/mail/send',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("✅ Email sent via SendGrid");
          resolve({ success: true, provider: 'sendgrid' });
        } else {
          console.error("❌ SendGrid error:", res.statusCode, responseData);
          resolve({ 
            success: false, 
            error: `SendGrid error: ${res.statusCode}`,
            details: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error("❌ SendGrid request failed:", error);
      resolve({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

// Brevo API Method
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

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("✅ Email sent via Brevo API");
          resolve({ success: true, provider: 'brevo' });
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
    const info = await transporter.sendMail({
      from: `CSCQC System <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log("✅ Email sent via SMTP");
    return { success: true, provider: 'smtp', info };
  } catch (error) {
    console.error("❌ SMTP failed:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = sendEmail;
