'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { zipToRegion, isValidUSZip } from '@/lib/region'

type Step = 'details' | 'verify-email' | 'verify-phone' | 'phone-otp'

export function SignupForm() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<Step>('details')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    zip: '',
    phone: '',
  })
  const [otp, setOtp] = useState('')

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
        data: {
          username: form.username,
          region,
          // zip is intentionally not stored
        },
      },
    })

    setLoading(false)
    if (signupError) {
      setError(signupError.message)
      return
    }

    setStep('verify-email')
  }

  async function handleSendPhoneOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const phone = form.phone.replace(/\D/g, '')
    const e164 = phone.startsWith('1') ? `+${phone}` : `+1${phone}`

    const { error } = await supabase.auth.signInWithOtp({ phone: e164 })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }
    setStep('phone-otp')
  }

  async function handleVerifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const phone = form.phone.replace(/\D/g, '')
    const e164 = phone.startsWith('1') ? `+${phone}` : `+1${phone}`

    const { error } = await supabase.auth.verifyOtp({
      phone: e164,
      token: otp,
      type: 'sms',
    })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    // Profile creation is handled by database trigger on auth.users insert
    router.push('/profile/setup')
  }

  if (step === 'verify-email') {
    return (
      <div className="card text-center">
        <div className="text-4xl mb-4">📬</div>
        <h2 className="font-semibold text-stone-800">Check your email</h2>
        <p className="mt-2 text-sm text-stone-500">
          We sent a confirmation link to <strong>{form.email}</strong>.
          Click it to verify your email, then come back here.
        </p>
        <button
          onClick={() => setStep('verify-phone')}
          className="btn-primary mt-6 w-full"
        >
          I confirmed my email →
        </button>
      </div>
    )
  }

  if (step === 'verify-phone') {
    return (
      <form onSubmit={handleSendPhoneOtp} className="card space-y-4">
        <div className="text-center mb-2">
          <div className="text-4xl mb-3">📱</div>
          <h2 className="font-semibold text-stone-800">Verify your phone</h2>
          <p className="text-sm text-stone-500 mt-1">
            We'll send a code by text. US numbers only for now.
          </p>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className="label" htmlFor="phone">Phone number</label>
          <input
            id="phone"
            type="tel"
            placeholder="(555) 000-0000"
            className="input"
            required
            {...field('phone')}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Sending…' : 'Send verification code'}
        </button>
      </form>
    )
  }

  if (step === 'phone-otp') {
    return (
      <form onSubmit={handleVerifyPhoneOtp} className="card space-y-4">
        <div className="text-center mb-2">
          <div className="text-4xl mb-3">🔐</div>
          <h2 className="font-semibold text-stone-800">Enter your code</h2>
          <p className="text-sm text-stone-500 mt-1">
            Sent to {form.phone}
          </p>
        </div>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div>
          <label className="label" htmlFor="otp">6-digit code</label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="000000"
            className="input text-center text-2xl tracking-widest"
            required
            value={otp}
            onChange={(e) => { setOtp(e.target.value); setError('') }}
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Verifying…' : 'Verify phone →'}
        </button>
        <button
          type="button"
          onClick={() => setStep('verify-phone')}
          className="w-full text-sm text-stone-500 hover:underline"
        >
          Didn't get it? Go back
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSignup} className="card space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

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
          We convert this to a general region (e.g. "Florida") — your zip is never stored or shown.
        </p>
        {form.zip && isValidUSZip(form.zip) && (
          <p className="mt-1 text-xs text-brand-600 font-medium">
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
