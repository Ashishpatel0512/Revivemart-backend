const mongoose = require('mongoose');

// Define the OTP schema
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 50 }, // Auto-delete document after 15 seconds
});

// Compile the OTP model
const Otp = mongoose.model('Otp', otpSchema);

module.exports = Otp;
