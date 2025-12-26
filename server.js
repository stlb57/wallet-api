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
  // Accept from JSON body OR query params
  const userId =
    req.body?.userId || req.query.userId || "UNKNOWN_USER";

  const amount =
    Number(req.body?.amount || req.query.amount);

  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid amount is required"
    });
  }

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

