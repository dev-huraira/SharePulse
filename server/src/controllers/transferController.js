const dayjs = require('dayjs')
const Transfer = require('../models/Transfer')
const { generateUniqueOtp } = require('../services/otpService')

function isValidOtp(otp) {
  return typeof otp === 'string' && /^\d{6}$/.test(otp)
}

function sanitizeTransfer(t) {
  return {
    otp: t.otp,
    originalName: t.originalName,
    mimeType: t.mimeType,
    size: t.size,
    status: t.status,
    expiresAt: t.expiresAt,
    createdAt: t.createdAt,
  }
}

async function upload(req, res) {
  const io = req.app.get('io')
  const env = req.app.get('envConfig')

  const { name, size, mimeType } = req.body || {}
  if (typeof name !== 'string' || name.trim().length < 1) {
    return res.status(400).json({ error: 'Missing file name' })
  }
  const sizeNum = Number(size)
  if (!Number.isFinite(sizeNum) || sizeNum <= 0) {
    return res.status(400).json({ error: 'Missing file size' })
  }
  if (sizeNum > env.maxFileBytes) {
    return res.status(413).json({ error: 'File too large' })
  }

  const otp = await generateUniqueOtp(Transfer)
  const expiresAt = dayjs().add(env.otpTtlMinutes, 'minute').toDate()

  const transfer = await Transfer.create({
    otp,
    originalName: name,
    mimeType: typeof mimeType === 'string' && mimeType ? mimeType : 'application/octet-stream',
    size: sizeNum,
    status: 'waiting',
    expiresAt,
  })

  io?.to(`otp:${otp}`).emit('transfer_created', sanitizeTransfer(transfer))

  return res.status(201).json({
    otp,
    expiresAt,
    file: {
      name: transfer.originalName,
      size: transfer.size,
      mimeType: transfer.mimeType,
    },
  })
}

async function verify(req, res) {
  const io = req.app.get('io')
  const { otp } = req.body || {}

  if (!isValidOtp(otp)) return res.status(400).json({ error: 'Invalid OTP format' })

  const transfer = await Transfer.findOne({ otp })
  if (!transfer) return res.status(404).json({ error: 'OTP not found' })

  if (transfer.usedAt) return res.status(410).json({ error: 'OTP already used' })
  if (transfer.expiresAt.getTime() <= Date.now()) {
    transfer.status = 'expired'
    await transfer.save()
    return res.status(410).json({ error: 'OTP expired' })
  }

  if (transfer.status === 'waiting') {
    transfer.status = 'verified'
    await transfer.save()
  }

  io?.to(`otp:${otp}`).emit('receiver_verified', sanitizeTransfer(transfer))

  return res.json({
    ok: true,
    otp,
    expiresAt: transfer.expiresAt,
    file: {
      name: transfer.originalName,
      size: transfer.size,
      mimeType: transfer.mimeType,
    },
  })
}

async function download(req, res) {
  return res.status(410).json({ error: 'Server-based downloads are disabled. This transfer uses WebRTC P2P.' })
}

module.exports = { upload, verify, download }

