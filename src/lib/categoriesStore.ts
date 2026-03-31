import { useSyncExternalStore } from 'react'
import { safeLocalStorageGet, safeLocalStorageSet } from './safeStorage'

const STORAGE_KEY = 'dusqr_categories_v1'
const EVENT_NAME = 'dusqr:categories_changed'

let cache: string[] | null = null

function safeParse(json: string | null): unknown {
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function normalizeList(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const out: string[] = []
  for (const item of input) {
    const v = String(item ?? '').trim()
    if (v) out.push(v)
  }
  return Array.from(new Set(out))
}

function readFromStorage(): string[] {
  const raw = safeParse(safeLocalStorageGet(STORAGE_KEY))
  return normalizeList(raw)
}

export function getCategories(): string[] {
  if (cache) return cache
  cache = readFromStorage()
  return cache
}

export function setCategories(categories: string[]) {
  const next = normalizeList(categories)
  cache = next
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function ensureSeedCategories(fromProducts: { category: string }[]) {
  if (getCategories().length > 0) return
  const derived = Array.from(new Set(fromProducts.map((p) => p.category))).filter(
    Boolean,
  )
  setCategories(derived.length > 0 ? derived : ['Genel'])
}

export function addCategory(name: string) {
  const n = name.trim()
  if (!n) return
  setCategories([n, ...getCategories()])
}

export function removeCategory(name: string) {
  const n = name.trim()
  if (!n) return
  setCategories(getCategories().filter((c) => c !== n))
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

export function useCategories() {
  return useSyncExternalStore(subscribe, getCategories, getCategories)
}

