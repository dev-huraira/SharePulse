const Transfer = require('../models/Transfer')

function startCleanupJob({ intervalMs, io }) {
  const tick = async () => {
    const now = new Date()
    const expired = await Transfer.find({
      expiresAt: { $lte: now },
    }).limit(200)

    for (const t of expired) {
      try {
        t.status = 'expired'
        await t.save()
        io?.to(`otp:${t.otp}`).emit('transfer_expired', { otp: t.otp })
        await t.deleteOne()
      } catch {
        // ignore
      }
    }
  }

  const timer = setInterval(() => {
    tick().catch(() => {})
  }, intervalMs)

  return () => clearInterval(timer)
}

module.exports = { startCleanupJob }

