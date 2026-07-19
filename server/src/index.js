const http = require('http')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const { Server } = require('socket.io')
const rateLimit = require('express-rate-limit')

const { loadEnv } = require('./config/env')
const { connectMongo } = require('./config/db')
const { createTransferRouter } = require('./routes/transferRoutes')
const { registerSocketHandlers } = require('./socket/register')
const { startCleanupJob } = require('./jobs/cleanup')

async function main() {
  const env = loadEnv()

  await connectMongo(env.mongoUri)

  const app = express()
  app.set('envConfig', env)

  const corsOrigin = (origin, cb) => {
    if (env.allowAnyOrigin) return cb(null, true)
    // Allow non-browser requests without origin header (health checks, curl)
    if (!origin) return cb(null, true)
    if (env.allowedOrigins.includes(origin)) return cb(null, true)
    return cb(new Error('Not allowed by CORS'))
  }

  app.use(
    cors({
      origin: corsOrigin,
      credentials: false,
    }),
  )
  app.set('trust proxy', 1)
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
  app.use(express.json({ limit: '1mb' }))
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))

  const apiLimiter = rateLimit({
    windowMs: env.requestWindowMs,
    limit: env.requestMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
  })
  const otpLimiter = rateLimit({
    windowMs: env.requestWindowMs,
    limit: env.otpActionMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many OTP attempts. Please try again later.' },
  })

  const server = http.createServer(app)
  const io = new Server(server, {
    cors: { origin: corsOrigin },
  })
  app.set('io', io)

  registerSocketHandlers(io, { burstPerSec: env.socketBurstPerSec })
  startCleanupJob({ intervalMs: env.cleanupIntervalMs, io })

  // WebRTC mode: no server-side file uploads (signaling-only)

  app.get('/health', (req, res) => res.json({ ok: true }))
  app.get('/api/rtc-config', (req, res) => {
    const iceServers = [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    ]
    if (env.turnUrl && env.turnUsername && env.turnCredential) {
      iceServers.push({
        urls: env.turnUrl,
        username: env.turnUsername,
        credential: env.turnCredential,
      })
    }
    res.json({ iceServers })
  })
  const transferRouter = createTransferRouter()
  // Support both forms: `/upload` and `/api/upload`
  app.use('/api', apiLimiter)
  app.use(['/upload', '/verify', '/api/upload', '/api/verify'], otpLimiter)
  app.use('/', transferRouter)
  app.use('/api', transferRouter)

  // Multer errors -> 413, otherwise 500
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large' })
    }
    // eslint-disable-next-line no-console
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  })

  server.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on http://localhost:${env.port}`)
  })
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

