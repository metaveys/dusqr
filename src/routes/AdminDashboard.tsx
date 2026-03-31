import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { backend } from '../lib/backend'
import { isSupabaseEnabled } from '../lib/supabaseClient'
import { isAuthed, logout } from '../lib/auth'
import { isAuthedSupabase, signOut } from '../lib/supabaseAuth'
import type { Product } from '../types'

export function AdminDashboard() {
  const nav = useNavigate()
  const products = backend.useProducts()
  const categories = backend.useCategories()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isSupabaseEnabled) backend.ensureSeed()
  }, [])
  useEffect(() => {
    if (!isSupabaseEnabled) backend.ensureSeedCategories(products)
  }, [products])
  useEffect(() => {
    ;(async () => {
      if (isSupabaseEnabled) {
        setAuthed(await isAuthedSupabase())
      } else {
        setAuthed(isAuthed())
      }
    })()
  }, [])

  const categoriesSorted = useMemo(() => {
    return [...categories].sort((a, b) => a.localeCompare(b, 'tr'))
  }, [categories])

  const [editingId, setEditingId] = useState<string | null>(null)
  const editing = useMemo(
    () => products.find((p) => p.id === editingId) ?? null,
    [editingId, products],
  )

  const [name, setName] = useState('')
  const [price, setPrice] = useState<string>('0')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [jsonText, setJsonText] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')

  const authStatus = authed === null ? 'checking' : authed ? 'ok' : 'denied'

  useEffect(() => {
    if (!editing) return
    setName(editing.name)
    setPrice(String(editing.price))
    setDescription(editing.description)
    setCategory(editing.category)
    setImageUrl(editing.image_url)
    setError(null)
  }, [editing])

  function clearForm() {
    setEditingId(null)
    setName('')
    setPrice('0')
    setDescription('')
    setCategory('')
    setImageUrl('')
    setError(null)
  }

  async function onPickFile(file: File | null) {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Lütfen bir görsel dosyası seç.')
      return
    }
    if (file.size > 2_500_000) {
      setError('Görsel çok büyük. (Max ~2.5MB)')
      return
    }

    try {
      if (backend.uploadImage) {
        const url = await backend.uploadImage(file)
        setImageUrl(url)
        return
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result ?? ''))
        reader.onerror = () => reject(new Error('read_failed'))
        reader.readAsDataURL(file)
      })
      setImageUrl(dataUrl)
    } catch {
      setError('Görsel yükleme başarısız.')
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const n = name.trim()
    const c = category.trim()
    const d = description.trim()
    const p = Number(price)
    if (!n) return setError('Ürün adı gerekli.')
    if (!Number.isFinite(p) || p < 0) return setError('Fiyat geçersiz.')
    if (!c) return setError('Kategori gerekli.')

    const next: Product = {
      id: editingId ?? crypto.randomUUID(),
      name: n,
      price: Math.round(p * 100) / 100,
      description: d,
      category: c,
      image_url: imageUrl.trim(),
    }
    await backend.upsertProduct(next as any)
    clearForm()
  }

  if (authStatus === 'checking') {
    return (
      <div className="min-h-[100svh] bg-zinc-950">
        <div className="mx-auto w-full max-w-5xl px-4 py-10">
          <div className="rounded-2xl bg-white/5 p-6 text-sm text-zinc-300 ring-1 ring-white/10">
            Kontrol ediliyor…
          </div>
        </div>
      </div>
    )
  }
  if (authStatus === 'denied') return <Navigate to="/admin" replace />

  return (
    <div className="min-h-[100svh] bg-zinc-950">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">
              Admin Panel
            </h1>
            <p className="mt-2 text-sm text-zinc-300">
              Ürünleri manuel yönet: ekle, düzenle, sil. Değişiklikler menüye
              anında yansır.
            </p>
          </div>
          <Link
            to="/"
            className="rounded-full bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
          >
            Menüye dön
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-zinc-200">
                  {editingId ? 'Ürünü düzenle' : 'Yeni ürün ekle'}
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  Görsel yükleyebilir veya URL yapıştırabilirsin.
                </div>
              </div>
              {editingId ? (
                <button
                  type="button"
                  onClick={clearForm}
                  className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
                >
                  İptal
                </button>
              ) : null}
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-zinc-200">
                    Ürün adı
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-xl bg-zinc-950/40 px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-white/40"
                    placeholder="Örn: Trüflü Burger"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-200">
                    Fiyat (₺)
                  </label>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    inputMode="decimal"
                    className="mt-2 w-full rounded-xl bg-zinc-950/40 px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-white/40"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-zinc-200">
                    Kategori
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-2 w-full rounded-xl bg-zinc-950/40 px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-white/40"
                  >
                    <option value="" disabled>
                      Kategori seç…
                    </option>
                    {categoriesSorted.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-200">
                    Görsel URL (opsiyonel)
                  </label>
                  <input
                    value={imageUrl.startsWith('data:') ? '' : imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="mt-2 w-full rounded-xl bg-zinc-950/40 px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-white/40"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-zinc-200">
                  Açıklama
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-xl bg-zinc-950/40 px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-white/40"
                  placeholder="Kısa ve iştah açıcı açıklama..."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-zinc-950/30 p-4 ring-1 ring-white/10">
                  <div className="text-xs font-semibold text-zinc-300">
                    Görsel yükle (max ~2.5MB)
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
                    className="mt-3 block w-full text-sm text-zinc-200 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-extrabold file:text-zinc-900"
                  />
                </div>

                <div className="overflow-hidden rounded-xl bg-zinc-950/30 ring-1 ring-white/10">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Önizleme"
                      className="h-40 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-sm text-zinc-400">
                      Önizleme yok
                    </div>
                  )}
                </div>
              </div>

              {error ? (
                <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 ring-1 ring-red-500/20">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                className="w-full rounded-xl bg-white px-4 py-3 text-base font-extrabold text-zinc-900 shadow-[0_20px_50px_rgba(255,255,255,0.12)]"
              >
                {editingId ? 'Kaydet' : 'Ürün ekle'}
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-zinc-200">
                  Ürünler ({products.length})
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  Düzenlemek için seç, silmek için butona bas.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isSupabaseEnabled) {
                    void signOut()
                  } else {
                    logout()
                  }
                  nav('/admin', { replace: true })
                }}
                className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
              >
                Çıkış
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-zinc-950/30 p-4 ring-1 ring-white/10">
              <div className="text-xs font-semibold text-zinc-300">
                Kategoriler ({categoriesSorted.length})
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-xl bg-zinc-950/40 px-4 py-3 text-sm text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-white/40"
                  placeholder="Yeni kategori adı…"
                />
                <button
                  type="button"
                  onClick={() => {
                    const n = newCategoryName.trim()
                    if (!n) return
                    void backend.addCategory(n)
                    setNewCategoryName('')
                  }}
                  className="shrink-0 rounded-xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-900"
                >
                  Ekle
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {categoriesSorted.map((c) => {
                  const usedCount = products.filter((p) => p.category === c).length
                  return (
                    <div
                      key={c}
                      className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-white/10"
                    >
                      <span>
                        {c}
                        <span className="text-zinc-400"> ({usedCount})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (usedCount > 0) {
                            setError(
                              `"${c}" kategorisi ${usedCount} üründe kullanılıyor. Önce ürünlerin kategorisini değiştir.`,
                            )
                            return
                          }
                          if (confirm(`"${c}" kategorisi silinsin mi?`)) {
                            void backend.removeCategory(c)
                            if (category === c) setCategory('')
                          }
                        }}
                        className="rounded-full bg-red-500/10 px-2 py-1 text-[11px] font-extrabold text-red-200 ring-1 ring-red-500/20 hover:bg-red-500/15"
                      >
                        Sil
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {products.length === 0 ? (
                <div className="rounded-xl bg-zinc-950/30 p-4 text-sm text-zinc-300 ring-1 ring-white/10">
                  Henüz ürün yok.
                </div>
              ) : (
                <div className="space-y-2">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className={[
                        'flex items-center gap-3 rounded-xl bg-zinc-950/30 p-3 ring-1 ring-white/10',
                        p.id === editingId ? 'ring-2 ring-white/30' : '',
                      ].join(' ')}
                    >
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingId(p.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="truncate text-sm font-extrabold text-white">
                          {p.name}
                        </div>
                        <div className="truncate text-xs text-zinc-400">
                          {p.category} • ₺{p.price}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            confirm(`"${p.name}" ürününü silmek istiyor musun?`)
                          ) {
                            void backend.removeProduct(p.id)
                            if (editingId === p.id) clearForm()
                          }
                        }}
                        className="rounded-full bg-red-500/10 px-3 py-2 text-xs font-extrabold text-red-200 ring-1 ring-red-500/20 hover:bg-red-500/15"
                      >
                        Sil
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-2xl bg-zinc-950/30 p-4 ring-1 ring-white/10">
              <div className="text-xs font-semibold text-zinc-300">
                Yedekle / İçeri aktar (JSON)
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (backend.exportProductsJson) setJsonText(backend.exportProductsJson())
                  }}
                  disabled={!backend.exportProductsJson}
                  className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
                >
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      if (backend.importProductsJson) backend.importProductsJson(jsonText)
                      setError(null)
                    } catch {
                      setError('JSON içeri aktarma başarısız.')
                    }
                  }}
                  disabled={!backend.importProductsJson}
                  className="rounded-full bg-white px-4 py-2 text-xs font-extrabold text-zinc-900"
                >
                  Import
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (backend.resetToDemo && confirm('Demo ürünlere sıfırlansın mı?')) {
                      backend.resetToDemo()
                    }
                  }}
                  disabled={!backend.resetToDemo}
                  className="rounded-full bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
                >
                  Demo’ya sıfırla
                </button>
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                rows={8}
                className="mt-3 w-full resize-none rounded-xl bg-zinc-950/40 px-4 py-3 text-xs text-zinc-100 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-white/40"
                placeholder="Export ile doldur veya JSON yapıştırıp Import'a bas."
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

