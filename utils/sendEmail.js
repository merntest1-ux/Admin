const sgMail = require('@sendgrid/mail');

async function sendEmail({ to, subject, text }) {
  console.log("sending Email via SendGrid");
  
  if (!process.env.SENDGRID_API_KEY) {
    console.error("SENDGRID_API_KEY not configured");
    return { 
      success: false, 
      error: "SendGrid API key not configured." 
    };
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER;
  const fromName = process.env.EMAIL_FROM_NAME || "CSCQC System";
  
  console.log(`From: ${fromName} <${fromEmail}>`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);

  try {
    const msg = {
      to: to,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: subject,
      text: text
    };

    await sgMail.send(msg);

    console.log("Email sent successfully via SendGrid");
    
    return { 
      success: true, 
      provider: 'sendgrid'
    };

  } catch (error) {
    console.error("SendGrid error:", error.message);
    if (error.response) {
      console.error("Error details:", JSON.stringify(error.response.body));
    }
    return { 
      success: false, 
      error: error.message,
      details: error.response ? error.response.body : error.toString()
    };
  }
}

module.exports = sendEmail;
