import nodemailer from "nodemailer";
import "dotenv/config"
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

const sendPasswordResetOtp = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Password Reset OTP",
    text: `Your password reset OTP is ${otp}. It expires in 5 minutes.`
  });
};

export default {
  sendPasswordResetOtp
};