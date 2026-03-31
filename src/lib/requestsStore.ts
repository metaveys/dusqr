import { useSyncExternalStore } from 'react'
import type { CustomerRequest } from '../types'
import { safeLocalStorageGet, safeLocalStorageSet } from './safeStorage'

const STORAGE_KEY = 'dusqr_customer_requests_v1'
const EVENT_NAME = 'dusqr:customer_requests_changed'

let cache: CustomerRequest[] | null = null

function safeParse(json: string | null): unknown {
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function normalizeItem(input: any): CustomerRequest | null {
  if (!input || typeof input !== 'object') return null
  const id = String(input.id ?? '').trim()
  const message = String(input.message ?? '').trim()
  const created_at = String(input.created_at ?? '').trim()
  const seen_atRaw = input.seen_at
  const seen_at =
    seen_atRaw === null || seen_atRaw === undefined
      ? null
      : String(seen_atRaw).trim() || null

  if (!id || !message || !created_at) return null
  return { id, message, created_at, seen_at }
}

function normalizeList(input: unknown): CustomerRequest[] {
  if (!Array.isArray(input)) return []
  const out: CustomerRequest[] = []
  for (const item of input) {
    const v = normalizeItem(item)
    if (v) out.push(v)
  }
  return out
}

function readFromStorage(): CustomerRequest[] {
  const raw = safeParse(safeLocalStorageGet(STORAGE_KEY))
  return normalizeList(raw)
}

export function getRequests(): CustomerRequest[] {
  if (cache) return cache
  cache = readFromStorage()
  return cache
}

export function setRequests(list: CustomerRequest[]) {
  cache = list
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function addRequest(message: string) {
  const m = message.trim()
  if (!m) return
  const next: CustomerRequest = {
    id: crypto.randomUUID(),
    message: m,
    created_at: new Date().toISOString(),
    seen_at: null,
  }
  setRequests([next, ...getRequests()])
}

export function markRequestSeen(id: string) {
  const now = new Date().toISOString()
  const next = getRequests().map((r) =>
    r.id === id ? { ...r, seen_at: r.seen_at ?? now } : r,
  )
  setRequests(next)
}

function subscribe(callback: () => void) {
  const onEvent = () => {
    cache = readFromStorage()
    callback()
  }
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      cache = readFromStorage()
      callback()
    }
  }
  window.addEventListener(EVENT_NAME, onEvent)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EVENT_NAME, onEvent)
    window.removeEventListener('storage', onStorage)
  }
}

export function useRequests() {
  return useSyncExternalStore(subscribe, getRequests, getRequests)
}

