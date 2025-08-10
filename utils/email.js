import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendOTPEmail(to, otp) {
  const mailOptions = {
    from: `"PartSync Admin" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your OTP Code - PartSync Admin Login',
    text: `Your OTP code is: ${otp}. It will expire in 5 minutes.`,
    html: `<p>Your OTP code is:</p>
           <h2>${otp}</h2>
           <p>This code will expire in 5 minutes.</p>`
  };

  await transporter.sendMail(mailOptions);
}
