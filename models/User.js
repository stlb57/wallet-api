const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  otp: { type: String }, // Store temporary OTP
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);