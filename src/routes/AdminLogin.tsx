import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSupabaseEnabled } from '../lib/supabaseClient'
import { signInWithEmail } from '../lib/supabaseAuth'
import { getLockInfo, tryLogin } from '../lib/auth'

export function AdminLogin() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isSupabaseEnabled && !email) {
      setEmail('admin@duscafe.com')
    }
  }, [email])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    setBusy(true)
    try {
      if (isSupabaseEnabled) {
        const { error: e2 } = await signInWithEmail(email.trim(), password)
        if (e2) {
          setError(e2.message || 'Giriş başarısız.')
        } else {
          nav('/admin/dashboard')
        }
      } else {
        const lock = getLockInfo()
        if (lock.locked) {
          setError('Çok fazla deneme. Lütfen biraz bekleyip tekrar dene.')
          return
        }
        const res = await tryLogin(password)
        if (res.ok) {
          nav('/admin/dashboard')
        } else {
          setError(res.error ?? 'Giriş başarısız.')
        }
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-[100svh] bg-zinc-950">
      <div className="mx-auto w-full max-w-md px-4 py-10">
        <h1 className="text-3xl font-black tracking-tight text-white">
          Admin Girişi
        </h1>
        <p className="mt-2 text-sm text-zinc-300">
          {isSupabaseEnabled
            ? 'Supabase ile giriş yap.'
            : 'Panel şifre ile korunur (offline mod).'}
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-4 rounded-2xl bg-white/5 p-5 ring-1 ring-white/10"
        >
          {isSupabaseEnabled ? (
            <div>
              <label className="text-sm font-semibold text-zinc-200">
                E-posta
              </label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="mt-2 w-full rounded-xl bg-zinc-950/40 px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-white/40"
                placeholder="admin@duscafe.com"
                disabled={busy}
              />
            </div>
          ) : null}
          <div>
            <label className="text-sm font-semibold text-zinc-200">
              Şifre
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-2 w-full rounded-xl bg-zinc-950/40 px-4 py-3 text-base text-white ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-white/40"
              placeholder="••••••••"
              disabled={busy}
            />
          </div>

          {error ? (
            <div className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 ring-1 ring-red-500/20">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-white px-4 py-3 text-base font-extrabold text-zinc-900 shadow-[0_20px_50px_rgba(255,255,255,0.12)] disabled:opacity-60"
          >
            {busy ? 'Kontrol ediliyor…' : 'Giriş yap'}
          </button>
        </form>
      </div>
    </div>
  )
}

