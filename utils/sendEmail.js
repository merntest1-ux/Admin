const nodemailer = require('nodemailer');

async function sendEmail({ to, subject, text}) {
  console.log("sending Email via nodemailer");

  if(!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("EMAIL_USER or EMAIL_PASS not configured");

    return {
      success: false,
      error: "Email credentials not configured"
    };
  }

  const fromName = process.env.EMAIL_FROM_NAME || "CSCQC System";

  console.log(`From: ${fromName} <${process.env.EMAIL_USER}>`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject} `);

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const info = await transporter.sendMail({
      from: `${fromName} <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text
    });

    console.log("Email sent successfully");
    console.log("message id: ", info.messageId);

    return {
      success: true, 
      provider: 'nodemailer',
      message: info.messageId
    };
  } catch (error) {
    console.error("nodemailer error", error.message);

    return {
      success: false,
      error: error.message,
      details: error.toString()
    };
  }
}

module.exports = sendEmail;
