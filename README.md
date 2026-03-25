## SharePulse (Send Anywhere-style)

Real-time file sharing web app using a **6-digit one-time key** (OTP) with a **10-minute expiry**.

This version transfers files **peer-to-peer using WebRTC (RTCDataChannel)**. The backend is **signaling-only** (no file storage).

- **Frontend**: React + Tailwind CSS (Vite)
- **Backend**: Node.js + Express
- **Real-time**: Socket.io
- **Database**: MongoDB (temporary file metadata)

### Folder structure

- `client/` React app
- `server/` Express + Socket.io API (MVC-ish: `models/`, `controllers/`, `routes/`)

### Requirements

- Node.js 18+ (you have Node installed)
- MongoDB running locally (or a MongoDB URI)

### Setup (local)

Open **two terminals**.

#### 1) Backend

```bash
cd server
copy .env.example .env
npm install
npm run dev
```

Backend runs on `http://localhost:4000` by default.

#### 2) Frontend

```bash
cd client
copy .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### How it works

- **Sender**
  - Select a file (max 100MB by default)
  - Backend generates a **6-digit OTP** (metadata only; the file stays in the browser)
  - Sender shares OTP (or QR) with receiver
  - When receiver connects, sender creates a **WebRTC offer** and starts sending the file over a **data channel** in chunks
- **Receiver**
  - Enters OTP → `/verify` (validates OTP and loads metadata)
  - Receiver connects via signaling, receives the WebRTC offer, returns an answer, then receives chunks and reconstructs the file
  - When complete, the browser saves the file (download)
- **Security & cleanup**
  - OTP is **one-time use** (invalid after a completed transfer)
  - OTP expires after **10 minutes**
  - Only metadata is stored temporarily in MongoDB; no files are stored on the server

### API endpoints

- `POST /upload` (JSON metadata: `{ name, size, mimeType }`)
- `POST /verify` `{ "otp": "123456" }`
- `GET /download/:otp` (disabled in WebRTC mode; returns 410)

All endpoints are also available under the `/api` prefix (e.g. `POST /api/upload`).

### WebRTC signaling (Socket.io)

Socket.io is used only to exchange signaling messages, matched by OTP room:

- `webrtc_offer` (SDP offer)
- `webrtc_answer` (SDP answer)
- `webrtc_ice` (ICE candidates)

### STUN/TURN

- Uses public STUN by default (Google STUN).
- TURN is not configured by default; add a TURN server for restrictive networks / mobile carriers.

### Production hardening checklist

Before going live, configure these:

1. **HTTPS/WSS everywhere**
   - Host frontend and backend with TLS.
   - WebRTC in production should run in secure contexts.

2. **Strict CORS allow-list**
   - Set `ALLOW_ANY_ORIGIN=false`
   - Set `ALLOWED_ORIGINS` to your real domains (comma-separated).

3. **Rate limiting**
   - API and OTP actions are rate-limited.
   - Tune in env:
     - `REQUEST_WINDOW_MS`
     - `REQUEST_MAX`
     - `OTP_ACTION_MAX`
     - `SOCKET_BURST_PER_SEC`

4. **TURN server**
   - Set these in backend env:
     - `TURN_URL`
     - `TURN_USERNAME`
     - `TURN_CREDENTIAL`
   - Client fetches `/api/rtc-config` automatically.

5. **Monitoring/logging**
   - Keep server logs enabled (HTTP + socket connect/disconnect).
   - Add external monitoring/alerts in your hosting platform.

### Recommended production env example (server)

```env
NODE_ENV=production
PORT=4000

ALLOW_ANY_ORIGIN=false
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
CLIENT_ORIGIN=https://yourdomain.com

MONGO_URI=your-mongodb-atlas-uri

MAX_FILE_BYTES=104857600
OTP_TTL_MINUTES=10
CLEANUP_INTERVAL_MS=30000

REQUEST_WINDOW_MS=900000
REQUEST_MAX=400
OTP_ACTION_MAX=50
SOCKET_BURST_PER_SEC=20

TURN_URL=turn:your-turn-host:3478
TURN_USERNAME=your-turn-username
TURN_CREDENTIAL=your-turn-password
```

### Test plan (local)

1. Start backend and frontend.
2. Open **two browser windows** (or one normal + one incognito).
3. In window A (Sender): pick a file and note the OTP.
4. In window B (Receiver): enter OTP and start download.
5. Sender/Receiver should show live status and progress.

