// utils/sendEmail.js
const nodemailer = require("nodemailer");

// Sends an email using Gmail SMTP (or environment SMTP)
async function sendEmail({ to, subject, text }) {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,  // ✅ Use port 465 instead of 587
      secure: true,  // ✅ Must be true for port 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `CSCQC System <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return { success: true, info };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

module.exports = sendEmail;

