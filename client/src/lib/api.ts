import axios from 'axios'
import { API_URL } from './config'

export type UploadResponse = {
  otp: string
  expiresAt: string
  file: { name: string; size: number; mimeType: string }
}

export type VerifyResponse = {
  ok: true
  otp: string
  expiresAt: string
  file: { name: string; size: number; mimeType: string }
}

export const api = axios.create({
  baseURL: `${API_URL}/api`,
})

