import type { Product } from '../types'

type Props = {
  product: Product
}

export function ProductCard({ product }: Props) {
  return (
    <article className="overflow-hidden rounded-[20px] bg-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
      <div className="relative aspect-[4/3] w-full">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3">
          <h3 className="text-lg font-extrabold leading-tight tracking-tight text-white">
            {product.name}
          </h3>
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-sm font-extrabold text-zinc-900">
            ₺{product.price}
          </span>
        </div>
      </div>

      <div className="p-[15px]">
        <p className="text-sm leading-relaxed text-zinc-300">
          {product.description}
        </p>
      </div>
    </article>
  )
}

