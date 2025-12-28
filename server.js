require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const auth = require("./middleware/auth"); // Import our protection
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

app.use(express.json());

// Auth Routes (We will create this next)
app.use("/api/auth", require("./routes/auth"));

const generateTokens = require("./utils/tokenGenerator");

// 🔥 PROTECTED Recharge API
// Added the 'auth' middleware here to prevent unauthorized access
app.post("/api/wallet/recharge", auth, (req, res) => {
  // Now we use the ID from the AUTHENTICATED user, not a random body param
  const userId = req.user.id; 
  const amount = Number(req.body?.amount || req.query.amount);

  if (!amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Valid amount required" });
  }

  const tokens = generateTokens(userId, amount); // Existing logic preserved

  res.json({
    success: true,
    userId,
    totalTokens: tokens.length,
    tokens
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));