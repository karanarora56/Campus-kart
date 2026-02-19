import nodemailer from 'nodemailer';

// Create a function to get the transporter only when needed
const getTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// 1. Send OTP to Student
export const sendOTPEmail = async (email, otp) => {
  const transporter = getTransporter(); // Initialize right before sending
  
  const mailOptions = {
    from: `"Campus Kart Verification" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔐 ${otp} is your verification code`,
    html: `<div style="background:#0B0E14; color:white; padding:20px; text-align:center; font-family:sans-serif;">
            <h1 style="color:#7C3AED;">Campus Kart</h1>
            <p>Your Verification Code is:</p>
            <h2 style="letter-spacing:5px; color:#7C3AED;">${otp}</h2>
           </div>`
  };
  return transporter.sendMail(mailOptions);
};

// 2. Alert Admin HQ
export const sendAdminAlert = async (studentData) => {
  const transporter = getTransporter(); // Initialize right before sending
  
  const mailOptions = {
    from: `"Campus Kart Bot" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `🚨 New Student Registration: ${studentData.fullName}`,
    html: `<div style="font-family:sans-serif; border:1px solid #7C3AED; padding:20px;">
            <h3>New NITJ Access Request</h3>
            <p><strong>Name:</strong> ${studentData.fullName}</p>
            <p><strong>Email:</strong> ${studentData.email}</p>
            <p><strong>Branch:</strong> ${studentData.branch}</p>
            <p><strong>Batch:</strong> ${studentData.batch}</p>
            <p>Verification OTP has been sent.</p>
           </div>`
  };
  return transporter.sendMail(mailOptions);
};