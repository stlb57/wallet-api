const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmailOTP = async (email, otp) => {
  const mailOptions = {
    from: `"Wallet API Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Wallet Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
        <h2 style="color: #4CAF50;">Wallet API Verification</h2>
        <p>Hello,</p>
        <p>Your verification code is: <strong style="font-size: 24px; color: #333;">${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <hr />
        <p style="font-size: 12px; color: #888;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendEmailOTP;