import { useEffect, useMemo, useState } from 'react'
import { CategoryTabs } from '../components/CategoryTabs'
import { ProductCard } from '../components/ProductCard'
import { backend } from '../lib/backend'
import { isSupabaseEnabled } from '../lib/supabaseClient'

export function PublicMenu() {
  useEffect(() => {
    if (!isSupabaseEnabled) backend.ensureSeed()
  }, [])

  const products = backend.useProducts()
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [feedbackBusy, setFeedbackBusy] = useState(false)

  const categories = useMemo(() => {
    const uniq = Array.from(new Set(products.map((p) => p.category)))
    return ['Tümü', ...uniq]
  }, [products])

  const [selected, setSelected] = useState<string>(categories[0] ?? 'Tümü')

  const filtered = useMemo(() => {
    if (selected === 'Tümü') return products
    return products.filter((p) => p.category === selected)
  }, [products, selected])

  useEffect(() => {
    if (!categories.includes(selected)) setSelected('Tümü')
  }, [categories, selected])

  return (
    <div className="min-h-[100svh] bg-zinc-950">
      <div className="mx-auto w-full max-w-5xl px-4">
        <header className="pt-8">
          <div className="flex items-start justify-end">
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setFeedbackError(null)
                  setFeedbackOpen(true)
                }}
                className="rounded-2xl bg-white/5 px-4 py-3 text-sm font-extrabold text-zinc-100 ring-1 ring-white/10 hover:bg-white/10"
              >
                Dilek/Öneri/Şikayet
              </button>
              <div className="mt-1 text-xs text-zinc-400">
                (Okuyacağımızdan emin olabilirsiniz :))
              </div>
            </div>
          </div>

          <div className="relative mx-auto mb-3 mt-2 flex w-fit items-center justify-center">
            <div className="absolute inset-0 -z-10 rounded-[28px] bg-white/5 blur-xl" />
            <div className="rounded-[28px] bg-zinc-950/70 p-2 ring-1 ring-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
              <img
                src="/dus-cafe-logo.png"
                alt="DÜŞ Cafe"
                className="h-24 w-auto select-none sm:h-28"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            DÜŞ CAFE'YE HOŞGELDİNİZ !
          </h1>
        </header>

        <CategoryTabs
          categories={categories}
          selected={selected}
          onSelect={setSelected}
        />

        <main className="pb-10 pt-4">
          {filtered.length === 0 ? (
            <div className="rounded-2xl bg-white/5 p-6 text-sm text-zinc-300 ring-1 ring-white/10">
              Bu kategoride ürün yok.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>

      {feedbackOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setFeedbackOpen(false)}
            aria-label="Kapat"
          />
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-zinc-950 p-5 ring-1 ring-white/10 shadow-[0_40px_120px_rgba(0,0,0,0.65)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-black tracking-tight text-white">
                  Dilek/Öneri/Şikayet
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  Mesajın işletmeye iletilecek.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackOpen(false)}
                className="rounded-full bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 ring-1 ring-white/10 hover:bg-white/10"
              >
                Kapat
              </button>
            </div>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={6}
              className="mt-4 w-full resize-none rounded-2xl bg-white/5 px-4 py-3 text-sm text-zinc-100 ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-white/30"
              placeholder="Yazabilirsiniz…"
              disabled={feedbackBusy}
            />

            {feedbackError ? (
              <div className="mt-3 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 ring-1 ring-red-500/20">
                {feedbackError}
              </div>
            ) : null}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-zinc-900 disabled:opacity-60"
                disabled={feedbackBusy}
                onClick={async () => {
                  const msg = feedbackText.trim()
                  if (!msg) {
                    setFeedbackError('Lütfen bir mesaj yaz.')
                    return
                  }
                  setFeedbackBusy(true)
                  setFeedbackError(null)
                  try {
                    await backend.addRequest(msg)
                    setFeedbackText('')
                    setFeedbackOpen(false)
                  } catch (e) {
                    setFeedbackError(
                      e instanceof Error ? e.message : 'Gönderim başarısız.',
                    )
                  } finally {
                    setFeedbackBusy(false)
                  }
                }}
              >
                {feedbackBusy ? 'Gönderiliyor…' : 'Gönder'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

