import type { Product } from '../types'
import { supabase, isSupabaseEnabled } from './supabaseClient'
import {
  addCategory as addCategoryLocal,
  ensureSeedCategories as ensureSeedCategoriesLocal,
  removeCategory as removeCategoryLocal,
  useCategories as useCategoriesLocal,
} from './categoriesStore'
import {
  ensureSeed as ensureSeedLocal,
  exportProductsJson as exportProductsJsonLocal,
  importProductsJson as importProductsJsonLocal,
  removeProduct as removeProductLocal,
  resetToDemo as resetToDemoLocal,
  upsertProduct as upsertProductLocal,
  useProducts as useProductsLocal,
} from './productsStore'
import { useEffect, useSyncExternalStore } from 'react'

// -------- Local fallback (current behavior) ----------
export const localBackend = {
  enabled: true,
  ensureSeed: ensureSeedLocal,
  useProducts: useProductsLocal,
  upsertProduct: upsertProductLocal,
  removeProduct: removeProductLocal,
  exportProductsJson: exportProductsJsonLocal,
  importProductsJson: importProductsJsonLocal,
  resetToDemo: resetToDemoLocal,
  useCategories: useCategoriesLocal,
  ensureSeedCategories: ensureSeedCategoriesLocal,
  addCategory: addCategoryLocal,
  removeCategory: removeCategoryLocal,
}

// -------- Supabase backend ----------
const PRODUCTS_CHANNEL = 'dusqr_products'
const CATEGORIES_CHANNEL = 'dusqr_categories'

let productsCache: Product[] = []
let categoriesCache: string[] = []
const productsListeners = new Set<() => void>()
const categoriesListeners = new Set<() => void>()

let started = false
let productsUnsub: (() => void) | null = null
let categoriesUnsub: (() => void) | null = null

function emitProducts() {
  for (const cb of productsListeners) cb()
}
function emitCategories() {
  for (const cb of categoriesListeners) cb()
}

async function refreshProducts() {
  if (!supabase) return
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (!error && data) {
    productsCache = data as any
    emitProducts()
  }
}

async function refreshCategories() {
  if (!supabase) return
  const { data, error } = await supabase
    .from('categories')
    .select('name')
    .order('name', { ascending: true })
  if (!error && data) {
    categoriesCache = (data as any[]).map((d) => String(d.name))
    emitCategories()
  }
}

function startSupabaseRealtimeOnce() {
  if (!supabase || started) return
  started = true

  void refreshProducts()
  void refreshCategories()

  const productsChannel = supabase
    .channel(PRODUCTS_CHANNEL)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      () => void refreshProducts(),
    )
    .subscribe()

  productsUnsub = () => {
    void supabase!.removeChannel(productsChannel)
  }

  const categoriesChannel = supabase
    .channel(CATEGORIES_CHANNEL)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categories' },
      () => void refreshCategories(),
    )
    .subscribe()

  categoriesUnsub = () => {
    void supabase!.removeChannel(categoriesChannel)
  }
}

function useProductsSupabase() {
  useEffect(() => {
    startSupabaseRealtimeOnce()
  }, [])
  return useSyncExternalStore(
    (cb) => {
      startSupabaseRealtimeOnce()
      productsListeners.add(cb)
      return () => productsListeners.delete(cb)
    },
    () => productsCache,
    () => productsCache,
  )
}

function useCategoriesSupabase() {
  useEffect(() => {
    startSupabaseRealtimeOnce()
  }, [])
  return useSyncExternalStore(
    (cb) => {
      startSupabaseRealtimeOnce()
      categoriesListeners.add(cb)
      return () => categoriesListeners.delete(cb)
    },
    () => categoriesCache,
    () => categoriesCache,
  )
}

async function upsertProductSupabase(product: Product) {
  if (!supabase) return
  await supabase.from('products').upsert(product)
}

async function removeProductSupabase(id: string) {
  if (!supabase) return
  await supabase.from('products').delete().eq('id', id)
}

async function addCategorySupabase(name: string) {
  if (!supabase) return
  const n = name.trim()
  if (!n) return
  await supabase.from('categories').upsert({ name: n })
}

async function removeCategorySupabase(name: string) {
  if (!supabase) return
  const n = name.trim()
  if (!n) return
  await supabase.from('categories').delete().eq('name', n)
}

async function uploadImageSupabase(file: File): Promise<string> {
  if (!supabase) return ''
  const ext = file.name.split('.').pop() || 'png'
  const path = `products/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

export const backend = {
  mode: isSupabaseEnabled ? ('supabase' as const) : ('local' as const),
  enabled: true,

  // Products
  useProducts: isSupabaseEnabled ? useProductsSupabase : localBackend.useProducts,
  ensureSeed: localBackend.ensureSeed, // seed only applies to local mode
  upsertProduct: isSupabaseEnabled ? upsertProductSupabase : localBackend.upsertProduct,
  removeProduct: isSupabaseEnabled ? removeProductSupabase : localBackend.removeProduct,
  uploadImage: isSupabaseEnabled ? uploadImageSupabase : null,

  // JSON tools only in local mode
  exportProductsJson: isSupabaseEnabled ? null : localBackend.exportProductsJson,
  importProductsJson: isSupabaseEnabled ? null : localBackend.importProductsJson,
  resetToDemo: isSupabaseEnabled ? null : localBackend.resetToDemo,

  // Categories
  useCategories: isSupabaseEnabled
    ? useCategoriesSupabase
    : localBackend.useCategories,
  ensureSeedCategories: localBackend.ensureSeedCategories, // local seed helper
  addCategory: isSupabaseEnabled ? addCategorySupabase : localBackend.addCategory,
  removeCategory: isSupabaseEnabled ? removeCategorySupabase : localBackend.removeCategory,

  // housekeeping (optional)
  stopRealtime: () => {
    productsUnsub?.()
    categoriesUnsub?.()
    productsUnsub = null
    categoriesUnsub = null
    started = false
  },
}

