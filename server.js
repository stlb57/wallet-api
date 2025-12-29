require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const app = express();

// Middleware to read JSON body
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.error("MongoDB Connection Error ❌:", err));

// Register Auth Routes (Signup/Login/Verify still work)
app.use("/api/auth", require("./routes/auth"));

const generateTokens = require("./utils/tokenGenerator");

// Test route
app.get("/", (req, res) => {
  res.send("Wallet API is running 🚀");
});

// 🔥 UPDATED Recharge API → Now uses URL Parameters
// Removed the 'auth' middleware so it works without a token
app.post("/api/wallet/recharge", (req, res) => {
  // 🎯 Taking userId and amount from URL parameters (?userId=...&amount=...)
  const userId = req.query.userId || req.body.userId || "UNKNOWN_USER";
  const amount = Number(req.query.amount || req.body.amount);

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid amount is required"
    });
  }

  // Uses your existing utility logic
  const tokens = generateTokens(userId, amount);

  res.json({
    success: true,
    message: "Recharge successful",
    userId,
    totalTokens: tokens.length,
    tokens
  });
});

// Server start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});