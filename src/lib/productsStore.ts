import { useSyncExternalStore } from 'react'
import type { Product } from '../types'
import { mockProducts } from './mockData'
import { safeLocalStorageGet, safeLocalStorageSet } from './safeStorage'

const STORAGE_KEY = 'dusqr_products_v1'
const EVENT_NAME = 'dusqr:products_changed'

let cache: Product[] | null = null

function safeParse(json: string | null): unknown {
  if (!json) return null
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

function normalizeProduct(input: any): Product | null {
  if (!input || typeof input !== 'object') return null
  const id = String(input.id ?? '').trim()
  const name = String(input.name ?? '').trim()
  const description = String(input.description ?? '').trim()
  const category = String(input.category ?? '').trim()
  const image_url = String(input.image_url ?? '').trim()
  const priceNum = Number(input.price)

  if (!id || !name || !category) return null
  if (!Number.isFinite(priceNum) || priceNum < 0) return null

  return {
    id,
    name,
    price: priceNum,
    description,
    category,
    image_url,
  }
}

function normalizeList(input: unknown): Product[] {
  if (!Array.isArray(input)) return []
  const out: Product[] = []
  for (const item of input) {
    const p = normalizeProduct(item)
    if (p) out.push(p)
  }
  return out
}

function readFromStorage(): Product[] {
  const raw = safeParse(safeLocalStorageGet(STORAGE_KEY))
  return normalizeList(raw)
}

export function getProducts(): Product[] {
  if (cache) return cache
  cache = readFromStorage()
  return cache
}

export function setProducts(products: Product[]) {
  cache = products
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(products))
  window.dispatchEvent(new Event(EVENT_NAME))
}

export function ensureSeed() {
  if (getProducts().length > 0) return
  setProducts(mockProducts)
}

export function upsertProduct(product: Product) {
  const list = getProducts()
  const idx = list.findIndex((p) => p.id === product.id)
  const next =
    idx >= 0
      ? [...list.slice(0, idx), product, ...list.slice(idx + 1)]
      : [product, ...list]
  setProducts(next)
}

export function removeProduct(id: string) {
  const next = getProducts().filter((p) => p.id !== id)
  setProducts(next)
}

export function resetToDemo() {
  setProducts(mockProducts)
}

export function exportProductsJson(): string {
  return JSON.stringify(getProducts(), null, 2)
}

export function importProductsJson(json: string) {
  const raw = safeParse(json)
  const list = normalizeList(raw)
  setProducts(list)
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

export function useProducts() {
  return useSyncExternalStore(subscribe, getProducts, getProducts)
}

