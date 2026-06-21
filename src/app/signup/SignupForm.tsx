'use client'

import { useState } from 'react'
import { zipToRegion, isValidUSZip } from '@/lib/region'

type Step = 'welcome' | 'details' | 'verify-email'

const RULES = [
  {
    icon: '📋',
    title: 'You need an active listing to participate',
    body: 'Everyone here has something to offer. Before making offers on others\' listings, you\'ll create your own first.',
  },
  {
    icon: '📍',
    title: 'Your location is kept general',
    body: 'Your zip code is converted to a region (e.g. "Florida") and your zip is never stored or shown to anyone.',
  },
  {
    icon: '💬',
    title: 'All communication stays in-app',
    body: 'Don\'t share personal contact info until you\'re ready. Use the in-app thread to get comfortable first.',
  },
  {
    icon: '🤝',
    title: 'Community-owned and open source',
    body: 'No ads, no data sales. The code is public. If the platform ever shuts down, anyone can run their own instance.',
  },
]

export function SignupForm() {
  const [step, setStep] = useState<Step>('welcome')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

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

    if (!termsAccepted) {
      setError('Please accept the Terms of Service to continue.')
      return
    }
    if (!isValidUSZip(form.zip)) {
      setError('Please enter a valid US zip code.')
      return
    }

    setLoading(true)
    const region = zipToRegion(form.zip.trim())

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        username: form.username,
        region,
        termsAcceptedAt: new Date().toISOString(),
      }),
    })

    setLoading(false)
    if (!res.ok) {
      const { error } = await res.json()
      setError(error ?? 'Something went wrong.')
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
          Didn&apos;t get it? Check your spam folder or{' '}
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

  if (step === 'welcome') {
    return (
      <div className="card space-y-6">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Before you join — here&apos;s how this works</h2>
          <p className="mt-1 text-sm text-stone-500">BarterWithMe has a few simple rules that keep the community healthy.</p>
        </div>

        <ul className="space-y-4">
          {RULES.map((rule) => (
            <li key={rule.title} className="flex gap-3">
              <span className="mt-0.5 shrink-0 text-xl">{rule.icon}</span>
              <div>
                <p className="text-sm font-semibold text-stone-800">{rule.title}</p>
                <p className="mt-0.5 text-xs text-stone-500 leading-relaxed">{rule.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 text-xs text-stone-500">
          Read our{' '}
          <a href="/community-guidelines" className="underline" target="_blank">Community Guidelines</a>,{' '}
          <a href="/safety" className="underline" target="_blank">Safety tips</a>, and{' '}
          <a href="/terms" className="underline" target="_blank">Terms of Service</a>{' '}
          before joining.
        </div>

        <button
          onClick={() => setStep('details')}
          className="btn-primary w-full"
        >
          Got it — let&apos;s join →
        </button>
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
          Converted to a general region (e.g. &ldquo;Florida&rdquo;) — your zip is never stored or shown.
        </p>
        {form.zip && isValidUSZip(form.zip) && (
          <p className="mt-1 text-xs font-medium text-brand-600">
            Your region: {zipToRegion(form.zip.trim())}
          </p>
        )}
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
          checked={termsAccepted}
          onChange={(e) => { setTermsAccepted(e.target.checked); setError('') }}
          required
        />
        <span className="text-xs text-stone-500 leading-relaxed">
          I have read and agree to the{' '}
          <a href="/terms" className="underline" target="_blank">Terms of Service</a> and{' '}
          <a href="/community-guidelines" className="underline" target="_blank">Community Guidelines</a>.
          No financial information is ever required.
        </span>
      </label>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Creating account…' : 'Create account →'}
      </button>

      <p className="text-center text-xs text-stone-400">
        <button type="button" onClick={() => setStep('welcome')} className="underline hover:text-stone-600">
          ← Back to overview
        </button>
      </p>
    </form>
  )
}
