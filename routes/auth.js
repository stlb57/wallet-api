const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const User = require("../models/User");

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// 📝 1. SIGNUP: Requires phno, email, passwd
// 📝 SIGNUP: Now taking name, age, and gender
router.post("/register", async (req, res) => {
  const { name, age, gender, phoneNumber, email, password } = req.body; // Destructure new fields
  
  try {
    let user = await User.findOne({ $or: [{ phoneNumber }, { email }] });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save with the new details 🚀
    user = new User({ 
        name, 
        age, 
        gender, 
        phoneNumber, 
        email, 
        password: hashedPassword, 
        otp: otpCode 
    });
    
    await user.save();

    // Send via Twilio (Logic stays the same)
    await client.messages.create({
      body: `Your Wallet API verification code is: ${otpCode}`,
      from: process.env.TWILIO_PHONE,
      to: phoneNumber
    });

    res.json({ msg: "OTP Sent to phone" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});
// 🔑 2. LOGIN: Supports Email+Pass OR Phno+Pass
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or phone
  try {
    // Find user by email OR phone number
    const user = await User.findOne({ $or: [{ email: identifier }, { phoneNumber: identifier }] });
    if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

    // Check if user verified their OTP at least once
    if (!user.isVerified) return res.status(401).json({ msg: "Please verify your account first" });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: user.id, email: user.email, phone: user.phoneNumber } });
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// 📩 3. REQUEST LOGIN OTP: For Phno+OTP login flow
router.post("/request-otp", async (req, res) => {
  const { phoneNumber } = req.body;
  try {
    const user = await User.findOne({ phoneNumber });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otpCode;
    await user.save();

    await client.messages.create({
      body: `Your Wallet API login code is: ${otpCode}`,
      from: process.env.TWILIO_PHONE,
      to: phoneNumber
    });

    res.json({ msg: "Login OTP Sent" });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// ✅ 4. VERIFY OTP: Used for both Signup completion and Phone+OTP login
router.post("/verify", async (req, res) => {
  const { phoneNumber, otp } = req.body;
  try {
    const user = await User.findOne({ phoneNumber });
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