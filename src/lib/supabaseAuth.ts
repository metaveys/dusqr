import { supabase } from './supabaseClient'

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) throw new Error('supabase_disabled')
  return await supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export function getSession() {
  if (!supabase) return null
  return supabase.auth.getSession()
}

export async function isAuthedSupabase() {
  if (!supabase) return false
  const { data } = await supabase.auth.getSession()
  return Boolean(data.session)
}

