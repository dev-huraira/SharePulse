const Transfer = require('../models/Transfer')

function isValidOtp(otp) {
  return typeof otp === 'string' && /^\d{6}$/.test(otp)
}

async function loadActiveTransfer(otp) {
  if (!isValidOtp(otp)) return null
  const t = await Transfer.findOne({ otp })
  if (!t) return null
  if (t.usedAt) return null
  if (t.expiresAt.getTime() <= Date.now()) return null
  return t
}

function registerSocketHandlers(io, opts = {}) {
  const senderByOtp = new Map()
  const socketBuckets = new Map()
  const burstPerSec = Number.isFinite(opts.burstPerSec) ? Number(opts.burstPerSec) : 20

  const allowEvent = (socketId, eventName) => {
    const now = Date.now()
    const key = `${socketId}:${eventName}`
    const bucket = socketBuckets.get(key) || { ts: now, count: 0 }
    if (now - bucket.ts >= 1000) {
      bucket.ts = now
      bucket.count = 0
    }
    bucket.count += 1
    socketBuckets.set(key, bucket)
    // conservative fixed burst limit per second
    return bucket.count <= burstPerSec
  }

  io.on('connection', (socket) => {
    // eslint-disable-next-line no-console
    console.log(`[socket] connected ${socket.id}`)
    socket.emit('server_hello', { ok: true })

    socket.on('register_sender', async ({ otp }) => {
      const t = await loadActiveTransfer(otp)
      if (!t) return socket.emit('otp_error', { otp, error: 'OTP invalid/expired' })

      socket.join(`otp:${otp}`)
      socket.data.role = 'sender'
      socket.data.otp = otp
      senderByOtp.set(otp, socket.id)
      socket.to(`otp:${otp}`).emit('sender_online', { otp })
    })

    socket.on('register_receiver', async ({ otp }) => {
      const t = await loadActiveTransfer(otp)
      if (!t) return socket.emit('otp_error', { otp, error: 'OTP invalid/expired' })

      // Block sender and receiver in same browser socket session.
      // This mirrors Send Anywhere behavior for self-transfer in same session.
      const senderSocketId = senderByOtp.get(otp)
      if (senderSocketId && senderSocketId === socket.id) {
        return socket.emit('otp_error', {
          otp,
          error: 'You cannot receive your own key in the same browser session.',
        })
      }

      socket.join(`otp:${otp}`)
      socket.data.role = 'receiver'
      socket.data.otp = otp
      socket.to(`otp:${otp}`).emit('receiver_joined', { otp })
      io.to(`otp:${otp}`).emit('room_connected', { otp })
    })

    // Receiver explicitly ready to start WebRTC handshake (after clicking download)
    socket.on('receiver_ready', async ({ otp }) => {
      const t = await loadActiveTransfer(otp)
      if (!t) return socket.emit('otp_error', { otp, error: 'OTP invalid/expired' })
      socket.to(`otp:${otp}`).emit('receiver_ready', { otp })
    })

    // WebRTC signaling relay (offer/answer/ice) bound to OTP room
    socket.on('webrtc_offer', async ({ otp, sdp }) => {
      if (!allowEvent(socket.id, 'webrtc_offer')) return
      const t = await loadActiveTransfer(otp)
      if (!t) return socket.emit('otp_error', { otp, error: 'OTP invalid/expired' })
      socket.to(`otp:${otp}`).emit('webrtc_offer', { otp, sdp })
    })

    socket.on('webrtc_answer', async ({ otp, sdp }) => {
      if (!allowEvent(socket.id, 'webrtc_answer')) return
      const t = await loadActiveTransfer(otp)
      if (!t) return socket.emit('otp_error', { otp, error: 'OTP invalid/expired' })
      socket.to(`otp:${otp}`).emit('webrtc_answer', { otp, sdp })
    })

    socket.on('webrtc_ice', async ({ otp, candidate }) => {
      if (!allowEvent(socket.id, 'webrtc_ice')) return
      const t = await loadActiveTransfer(otp)
      if (!t) return socket.emit('otp_error', { otp, error: 'OTP invalid/expired' })
      socket.to(`otp:${otp}`).emit('webrtc_ice', { otp, candidate })
    })

    socket.on('transfer_complete', async ({ otp }) => {
      const t = await loadActiveTransfer(otp)
      if (!t) return
      t.usedAt = new Date()
      t.status = 'completed'
      t.completedAt = new Date()
      await t.save()
      io.to(`otp:${otp}`).emit('transfer_completed', { otp })
      await t.deleteOne()
    })

    socket.on('disconnect', () => {
      const otp = socket.data.otp
      // eslint-disable-next-line no-console
      console.log(`[socket] disconnected ${socket.id}`)
      if (!otp) return
      if (socket.data.role === 'sender') {
        if (senderByOtp.get(otp) === socket.id) senderByOtp.delete(otp)
        socket.to(`otp:${otp}`).emit('sender_offline', { otp })
      } else if (socket.data.role === 'receiver') {
        socket.to(`otp:${otp}`).emit('receiver_offline', { otp })
      }
    })
  })
}

module.exports = { registerSocketHandlers }

