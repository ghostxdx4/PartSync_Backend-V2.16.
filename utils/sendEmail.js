import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection failed:", error.message);
  } else {
    console.log("✅ SMTP connected successfully.");
  }
});

export const sendEmail = async (to, subject, text) => {
  try {
    console.log(`📧 Preparing to send email to: ${to}`);
    await transporter.sendMail({
      from: `"PartSync Admin" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`📩 Email sent successfully to ${to}`);
    return true;
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    console.log("🔁 Retrying in 2 seconds...");
    try {
      await new Promise((r) => setTimeout(r, 2000));
      await transporter.sendMail({
        from: `"PartSync Admin" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
      });
      console.log(`📩 Retried email successfully sent to ${to}`);
      return true;
    } catch (retryErr) {
      console.error("🚨 Email retry also failed:", retryErr.message);
      return false;
    }
  }
};
