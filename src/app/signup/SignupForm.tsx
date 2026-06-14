'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { zipToRegion, isValidUSZip } from '@/lib/region'

type Step = 'details' | 'verify-email'

export function SignupForm() {
  const supabase = createClient()
  const [step, setStep] = useState<Step>('details')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    zip: '',
  })

  const field = (name: keyof typeof form) => ({
    value: form[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [name]: e.target.value }))
      setError('')
    },
  })

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!isValidUSZip(form.zip)) {
      setError('Please enter a valid US zip code.')
      return
    }

    setLoading(true)
    const region = zipToRegion(form.zip.trim())

    const { error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          username: form.username,
          region,
        },
      },
    })

    setLoading(false)
    if (signupError) {
      setError(signupError.message)
      return
    }

    setSubmittedEmail(form.email)
    setStep('verify-email')
  }

  if (step === 'verify-email') {
    return (
      <div className="card text-center space-y-4">
        <div className="text-5xl">📬</div>
        <h2 className="font-semibold text-stone-800">Check your email</h2>
        <p className="text-sm text-stone-500">
          We sent a confirmation link to{' '}
          <strong className="text-stone-700">{submittedEmail}</strong>.
          Click it to verify your account and finish setting up your profile.
        </p>
        <p className="text-xs text-stone-400">
          Didn't get it? Check your spam folder or{' '}
          <button
            onClick={() => setStep('details')}
            className="underline hover:text-stone-600"
          >
            try again
          </button>
          .
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSignup} className="card space-y-4">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div>
        <label className="label" htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          placeholder="how others will see you"
          className="input"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_-]+"
          {...field('username')}
        />
        <p className="mt-1 text-xs text-stone-400">Letters, numbers, _ and - only</p>
      </div>

      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          className="input"
          required
          {...field('email')}
        />
      </div>

      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="at least 8 characters"
          className="input"
          required
          minLength={8}
          {...field('password')}
        />
      </div>

      <div>
        <label className="label" htmlFor="zip">Your zip code</label>
        <input
          id="zip"
          type="text"
          inputMode="numeric"
          placeholder="e.g. 32601"
          className="input"
          required
          maxLength={10}
          {...field('zip')}
        />
        <p className="mt-1 text-xs text-stone-400">
          Converted to a general region (e.g. "Florida") — your zip is never stored or shown.
        </p>
        {form.zip && isValidUSZip(form.zip) && (
          <p className="mt-1 text-xs font-medium text-brand-600">
            Your region: {zipToRegion(form.zip.trim())}
          </p>
        )}
      </div>

      <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 text-xs text-stone-500">
        By joining you agree to our{' '}
        <a href="/terms" className="underline">Terms of Service</a> and{' '}
        <a href="/community-guidelines" className="underline">Community Guidelines</a>.
        No financial information ever required.
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Creating account…' : 'Create account →'}
      </button>
    </form>
  )
}
