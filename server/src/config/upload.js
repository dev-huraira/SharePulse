const fs = require('fs')
const path = require('path')
const multer = require('multer')

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function makeUploadMiddleware({ uploadDir, maxFileBytes }) {
  ensureDir(uploadDir)

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const safeBase = path
        .basename(file.originalname)
        .replace(/[^\w.\-() ]+/g, '_')
        .slice(0, 120)
      const unique = `${Date.now()}-${Math.random().toString(16).slice(2)}`
      cb(null, `${unique}-${safeBase}`)
    },
  })

  return multer({
    storage,
    limits: { fileSize: maxFileBytes, files: 1 },
  })
}

module.exports = { makeUploadMiddleware }

