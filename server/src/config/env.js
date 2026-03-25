const path = require('path')

function requireEnv(name, fallback) {
  const value = process.env[name] ?? fallback
  if (value === undefined || value === '') {
    throw new Error(`Missing required env var: ${name}`)
  }
  return value
}

function intEnv(name, fallback) {
  const raw = requireEnv(name, fallback)
  const n = Number(raw)
  if (!Number.isFinite(n)) throw new Error(`Env var must be a number: ${name}`)
  return n
}

function csvEnv(name, fallback = '') {
  const raw = process.env[name] ?? fallback
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function loadEnv() {
  // Allow running from `server/` or workspace root
  require('dotenv').config({
    path: process.env.DOTENV_PATH || path.join(process.cwd(), '.env'),
  })

  const nodeEnv = process.env.NODE_ENV || 'development'
  const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  const allowAnyOrigin =
    process.env.ALLOW_ANY_ORIGIN === 'true' || (nodeEnv === 'development' && !process.env.CLIENT_ORIGIN)
  const allowedOrigins = csvEnv('ALLOWED_ORIGINS', clientOrigin)

  const env = {
    nodeEnv,
    port: intEnv('PORT', '4000'),
    clientOrigin,
    allowedOrigins,
    allowAnyOrigin,
    mongoUri: requireEnv('MONGO_URI', 'mongodb://127.0.0.1:27017/sharepulse'),
    uploadDir: requireEnv('UPLOAD_DIR', path.join(process.cwd(), 'uploads')),
    maxFileBytes: intEnv('MAX_FILE_BYTES', String(100 * 1024 * 1024)),
    otpTtlMinutes: intEnv('OTP_TTL_MINUTES', '10'),
    cleanupIntervalMs: intEnv('CLEANUP_INTERVAL_MS', String(30 * 1000)),
    requestWindowMs: intEnv('REQUEST_WINDOW_MS', String(15 * 60 * 1000)),
    requestMax: intEnv('REQUEST_MAX', '400'),
    otpActionMax: intEnv('OTP_ACTION_MAX', '50'),
    socketBurstPerSec: intEnv('SOCKET_BURST_PER_SEC', '20'),
    turnUrl: process.env.TURN_URL || '',
    turnUsername: process.env.TURN_USERNAME || '',
    turnCredential: process.env.TURN_CREDENTIAL || '',
  }

  return env
}

module.exports = { loadEnv }

