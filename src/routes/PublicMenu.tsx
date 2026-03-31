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
    </div>
  )
}

