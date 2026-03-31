import {
  safeLocalStorageGet,
  safeLocalStorageSet,
  safeSessionStorageGet,
  safeSessionStorageRemove,
  safeSessionStorageSet,
} from './safeStorage'

const SESSION_KEY = 'dusqr_admin_session_v1'
const ATTEMPTS_KEY = 'dusqr_admin_attempts_v1'

// SHA-256("Karan2012.")
const PASSWORD_HASH_HEX =
  'f7779b61245fb6b640aa9311cbc2c8f97322cf6e0ca3deb05a497b8f2e55a41e'

const MAX_ATTEMPTS = 5
const LOCK_MS = 60_000
const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12h

function now() {
  return Date.now()
}

function bufToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function sha256Hex(value: string): Promise<string> {
  const enc = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', enc)
  return bufToHex(digest)
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

type AttemptState = {
  count: number
  lockedUntil: number
}

function readAttempts(): AttemptState {
  try {
    const raw = safeLocalStorageGet(ATTEMPTS_KEY)
    const obj = raw ? JSON.parse(raw) : null
    const count = Number(obj?.count ?? 0)
    const lockedUntil = Number(obj?.lockedUntil ?? 0)
    return {
      count: Number.isFinite(count) ? count : 0,
      lockedUntil: Number.isFinite(lockedUntil) ? lockedUntil : 0,
    }
  } catch {
    return { count: 0, lockedUntil: 0 }
  }
}

function writeAttempts(state: AttemptState) {
  safeLocalStorageSet(ATTEMPTS_KEY, JSON.stringify(state))
}

export function getLockInfo() {
  const a = readAttempts()
  const locked = a.lockedUntil > now()
  return {
    locked,
    remainingMs: locked ? a.lockedUntil - now() : 0,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - a.count),
  }
}

export async function tryLogin(password: string): Promise<{ ok: boolean; error?: string }> {
  const a = readAttempts()
  const hashed = await sha256Hex(password)
  const ok = constantTimeEqual(hashed, PASSWORD_HASH_HEX)

  // One-time safety net: allow correct password even if lock is active.
  if (a.lockedUntil > now() && !ok) {
    return {
      ok: false,
      error: 'Çok fazla deneme. Lütfen biraz bekleyip tekrar dene.',
    }
  }

  if (!ok) {
    const nextCount = a.count + 1
    const lockedUntil = nextCount >= MAX_ATTEMPTS ? now() + LOCK_MS : 0
    writeAttempts({ count: nextCount, lockedUntil })
    return { ok: false, error: 'Hatalı şifre.' }
  }

  // success: reset attempts and set session
  writeAttempts({ count: 0, lockedUntil: 0 })
  safeSessionStorageSet(
    SESSION_KEY,
    JSON.stringify({ token: crypto.randomUUID(), createdAt: now() }),
  )
  return { ok: true }
}

export function logout() {
  safeSessionStorageRemove(SESSION_KEY)
}

export function isAuthed(): boolean {
  try {
    const raw = safeSessionStorageGet(SESSION_KEY)
    if (!raw) return false
    const obj = JSON.parse(raw)
    const createdAt = Number(obj?.createdAt ?? 0)
    if (!Number.isFinite(createdAt)) return false
    if (now() - createdAt > SESSION_TTL_MS) return false
    return true
  } catch {
    return false
  }
}

