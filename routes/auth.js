const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmailOTP = require("../utils/emailSender"); // Import our new utility

// 📝 1. SIGNUP: Now sends OTP to EMAIL
router.post("/register", async (req, res) => {
  const { name, age, gender, phoneNumber, email, password } = req.body;
  try {
    let user = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (user) return res.status(400).json({ msg: "User already exists with this email or phone" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    user = new User({ 
      name, age, gender, phoneNumber, email, 
      password: hashedPassword, 
      otp: otpCode 
    });
    
    await user.save();

    // 📧 Send OTP to EMAIL instead of Phone
    await sendEmailOTP(email, otpCode);

    res.json({ msg: "Signup successful. Verification OTP sent to your email." });
  } catch (err) {
    res.status(500).json({ msg: "Error in registration", error: err.message });
  }
});

// 🔑 2. LOGIN: Supports Email+Pass OR Phone+Pass
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body; 
  try {
    const user = await User.findOne({ $or: [{ email: identifier }, { phoneNumber: identifier }] });
    if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

    if (!user.isVerified) return res.status(401).json({ msg: "Please verify your email first" });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token, 
        user: { id: user.id, name: user.name, email: user.email } 
      });
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// 📩 3. REQUEST LOGIN OTP: Sends new OTP to EMAIL
router.post("/request-otp", async (req, res) => {
  const { email } = req.body; // Primary request via email now
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otpCode;
    await user.save();

    await sendEmailOTP(email, otpCode);
    res.json({ msg: "Login OTP sent to your email" });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// ✅ 4. VERIFY OTP: Checks email and OTP
router.post("/verify", async (req, res) => {
  const { email, otp } = req.body; // Verify via email
  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp) return res.status(400).json({ msg: "Invalid OTP" });

    user.isVerified = true;
    user.otp = null; 
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

module.exports = router;