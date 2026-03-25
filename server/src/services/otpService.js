function randomOtp6() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function generateUniqueOtp(TransferModel, attempts = 10) {
  for (let i = 0; i < attempts; i++) {
    const otp = randomOtp6()
    // eslint-disable-next-line no-await-in-loop
    const exists = await TransferModel.exists({ otp })
    if (!exists) return otp
  }
  throw new Error('Failed to generate unique OTP, try again')
}

module.exports = { generateUniqueOtp }

