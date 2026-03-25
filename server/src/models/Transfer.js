const mongoose = require('mongoose')

const TransferSchema = new mongoose.Schema(
  {
    otp: { type: String, required: true, unique: true, index: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    status: {
      type: String,
      enum: ['waiting', 'verified', 'connecting', 'transferring', 'completed', 'expired'],
      default: 'waiting',
      index: true,
    },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Transfer', TransferSchema)

