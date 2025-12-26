const express = require("express");
const app = express();

const generateTokens = require("./utils/tokenGenerator");

// Middleware to read JSON body
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("Wallet API is running 🚀");
});

// 🔥 Recharge API → generates JSON tokens (no storage)
app.post("/api/wallet/recharge", (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      success: false,
      message: "No JSON body received"
    });
  }

  const { userId, amount } = req.body;

  if (!userId || !amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid userId or amount"
    });
  }

  // Generate tokens (₹1 = 1 token)
  const tokens = generateTokens(userId, amount);

  return res.json({
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

