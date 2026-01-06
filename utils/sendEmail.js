// utils/sendEmail.js - Resend API Only
const https = require('https');

async function sendEmail({ to, subject, text }) {
  console.log("📧 Sending email via Resend API");
  
  // Check if API key is configured
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY not configured");
    return { 
      success: false, 
      error: "RESEND_API_KEY not configured. Please add it to your environment variables." 
    };
  }

  // Use verified email or Resend's test domain
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const fromName = process.env.RESEND_FROM_NAME || "CSCQC System";

  console.log(`📤 From: ${fromName} <${fromEmail}>`);
  console.log(`📥 To: ${to}`);
  console.log(`📋 Subject: ${subject}`);

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
          console.log("✅ Email sent successfully via Resend");
          console.log("📬 Response:", responseData);
          resolve({ success: true, provider: 'resend', data: responseData });
        } else {
          console.error("❌ Resend API error:", res.statusCode);
          console.error("📄 Error details:", responseData);
          resolve({ 
            success: false, 
            error: `Resend API error: ${res.statusCode}`,
            details: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error("❌ Resend request failed:", error.message);
      resolve({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

module.exports = sendEmail;
