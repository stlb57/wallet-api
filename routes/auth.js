const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 📝 1. REGISTER: Direct creation without OTP
router.post("/register", async (req, res) => {
  const { name, age, gender, phoneNumber, email, password } = req.body;
  try {
    let user = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (user) return res.status(400).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ 
      name, age, gender, phoneNumber, email, 
      password: hashedPassword 
    });
    
    await user.save();

    // Create token immediately so they are logged in after signup
    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
      if (err) throw err;
      res.json({ msg: "User registered successfully", token });
    });
  } catch (err) {
    res.status(500).json({ msg: "Server Error" });
  }
});

// 🔑 2. LOGIN: Email or Phone + Password
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body; 
  try {
    // Check if identifier matches email OR phone
    const user = await User.findOne({ 
      $or: [{ email: identifier }, { phoneNumber: identifier }] 
    });
    
    if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" }, (err, token) => {
      if (err) throw err;
      res.json({ 
        token, 
        user: { id: user.id, name: user.name, email: user.email, phone: user.phoneNumber } 
      });
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

module.exports = router;