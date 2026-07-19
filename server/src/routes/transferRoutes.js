const express = require('express')
const { upload, verify, download } = require('../controllers/transferController')

function createTransferRouter() {
  const router = express.Router()

  // WebRTC mode: no file upload; only metadata is sent
  router.post('/upload', express.json({ limit: '32kb' }), (req, res, next) =>
    Promise.resolve(upload(req, res)).catch(next),
  )

  router.post('/verify', (req, res, next) => Promise.resolve(verify(req, res)).catch(next))

  router.get('/download/:otp', (req, res, next) => Promise.resolve(download(req, res)).catch(next))

  return router
}

module.exports = { createTransferRouter }

