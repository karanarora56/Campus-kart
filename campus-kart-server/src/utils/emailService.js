// We are using the Brevo HTTP API via native 'fetch' to completely bypass Render's SMTP firewall!
const sendViaBrevo = async (toEmail, subject, htmlContent) => {
  try {
    const API_KEY = process.env.BREVO_API_KEY;

    if (!API_KEY) {
      throw new Error("BREVO_API_KEY is missing from environment variables");
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Campus Kart Verification',
          email: process.env.EMAIL_USER,
        },
        to: [{ email: toEmail }],
        subject,
        htmlContent,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Brevo full response:", data);
      throw new Error(data.message || 'Failed to send email');
    }

    return data;
  } catch (error) {
    console.error("Brevo API Error:", error.message);
    throw error;
  }
};
// 1. Send OTP to Student
export const sendOTPEmail = async (email, otp) => {
  const subject = `🔐 ${otp} is your verification code`;
  const html = `<div style="background:#0B0E14; color:white; padding:20px; text-align:center; font-family:sans-serif;">
          <h1 style="color:#7C3AED;">Campus Kart</h1>
          <p>Your Verification Code is:</p>
          <h2 style="letter-spacing:5px; color:#7C3AED;">${otp}</h2>
         </div>`;

  return sendViaBrevo(email, subject, html);
};

// 2. Alert Admin HQ
export const sendAdminAlert = async (studentData) => {
  const subject = `🚨 New Student Registration: ${studentData.fullName}`;
  const html = `<div style="font-family:sans-serif; border:1px solid #7C3AED; padding:20px;">
          <h3>New NITJ Access Request</h3>
          <p><strong>Name:</strong> ${studentData.fullName}</p>
          <p><strong>Email:</strong> ${studentData.email}</p>
         </div>`;

  return sendViaBrevo(process.env.ADMIN_EMAIL, subject, html);
};