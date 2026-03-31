## Supabase Kurulum (DÜŞ CAFE)

Bu proje iki modda çalışır:

- **Supabase modu**: `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` doluysa aktif olur. Ürün/kategori **herkese canlı** yansır (realtime).
- **Offline/local modu**: env yoksa localStorage ile çalışır (demo).

---

## 1) Proje oluştur

Supabase Dashboard → New project.

---

## 2) Tablolar

SQL Editor’da çalıştır:

```sql
-- categories
create table if not exists public.categories (
  name text primary key,
  created_at timestamptz not null default now()
);

-- products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  description text not null default '',
  category text not null references public.categories(name) on update cascade on delete restrict,
  image_url text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products(category);
```

---

## 3) Storage (görseller)

Storage → Create bucket:

- Bucket adı: `product-images`
- Public: **ON** (kolay kullanım için)

---

## 4) Auth (Admin)

Authentication → Users → “Add user”

- Email: ör. `admin@duscafe.com`
- Password: `Karan2012.`

> Admin login ekranı Supabase aktifken email+password ile giriş yapar.

---

## 5) RLS (Güvenlik)

### Basit model (önerilen başlangıç)

- Herkes **menüyü görsün**: `SELECT` public
- Sadece giriş yapan kullanıcı **yazabilsin**: `INSERT/UPDATE/DELETE` auth required

SQL Editor’da:

```sql
alter table public.products enable row level security;
alter table public.categories enable row level security;

-- public read
create policy "public read products"
on public.products for select
using (true);

create policy "public read categories"
on public.categories for select
using (true);

-- authed write
create policy "authed write products"
on public.products for all
to authenticated
using (true)
with check (true);

create policy "authed write categories"
on public.categories for all
to authenticated
using (true)
with check (true);
```

> Daha sıkı güvenlik isterseniz “authenticated” yerine sadece belirli admin’lere izin veren bir yapı kurulur (JWT claim / role).

---

## 6) Realtime

Database → Replication / Realtime ayarlarında `products` ve `categories` tabloları realtime için açık olmalı.

---

## 7) Proje env’leri

Supabase → Project Settings → API:

- Project URL → `VITE_SUPABASE_URL`
- anon public key → `VITE_SUPABASE_ANON_KEY`

Yerelde `.env` dosyası oluştur:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Netlify’da da aynı env’leri ekle (Site settings → Environment variables).

