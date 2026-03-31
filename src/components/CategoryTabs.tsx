type Props = {
  categories: string[]
  selected: string
  onSelect: (category: string) => void
}

export function CategoryTabs({ categories, selected, onSelect }: Props) {
  return (
    <div className="sticky top-0 z-20 -mx-4 bg-zinc-950/75 px-4 pb-3 pt-4 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => {
          const active = c === selected
          return (
            <button
              key={c}
              type="button"
              onClick={() => onSelect(c)}
              className={[
                'shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition',
                active
                  ? 'bg-white text-zinc-900 shadow-[0_10px_30px_rgba(255,255,255,0.12)]'
                  : 'bg-white/5 text-zinc-200 ring-1 ring-white/10 hover:bg-white/10',
              ].join(' ')}
            >
              {c}
            </button>
          )
        })}
      </div>
    </div>
  )
}

