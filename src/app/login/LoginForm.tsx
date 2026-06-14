'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/browse'
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      setError('Invalid email or password.')
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <form onSubmit={handleLogin} className="card space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          className="input"
          required
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError('') }}
        />
      </div>

      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          className="input"
          required
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError('') }}
        />
        <div className="mt-1 text-right">
          <a href="/reset-password" className="text-xs text-stone-400 hover:underline">
            Forgot password?
          </a>
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Logging in…' : 'Log in →'}
      </button>
    </form>
  )
}
