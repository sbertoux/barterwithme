'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Props {
  listingId: string
  listingTitle: string
  isLoggedIn: boolean
  existingOffer: { id: string; status: string } | null
}

const STATUS_COPY: Record<string, { label: string; color: string; desc: string }> = {
  pending:   { label: 'Pending',   color: 'bg-yellow-50 border-yellow-200 text-yellow-800', desc: 'Your offer is waiting for a response.' },
  countered: { label: 'Countered', color: 'bg-sky-50 border-sky-200 text-sky-800', desc: 'The owner sent a message. Check your offers.' },
  accepted:  { label: 'Accepted',  color: 'bg-green-50 border-green-200 text-green-700', desc: 'Your offer was accepted — time to make a plan.' },
  declined:  { label: 'Declined',  color: 'bg-stone-50 border-stone-200 text-stone-500', desc: 'This offer was declined.' },
  withdrawn: { label: 'Withdrawn', color: 'bg-stone-50 border-stone-200 text-stone-500', desc: 'You withdrew this offer.' },
}

export function MakeOfferForm({ listingId, listingTitle, isLoggedIn, existingOffer }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Existing active offer — show status card
  if (existingOffer && existingOffer.status !== 'declined' && existingOffer.status !== 'withdrawn') {
    const s = STATUS_COPY[existingOffer.status] ?? STATUS_COPY.pending
    return (
      <div className={`card border ${s.color}`}>
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-sm">Your offer</p>
          <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium">{s.label}</span>
        </div>
        <p className="text-sm opacity-80 mb-3">{s.desc}</p>
        <Link href={`/offers/${existingOffer.id}`} className="btn-primary text-sm w-full text-center block">
          {existingOffer.status === 'accepted' ? 'Open message thread →' : 'View offer →'}
        </Link>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="card bg-stone-900 border-stone-800 text-center">
        <p className="text-white font-semibold mb-1">Want to trade for this?</p>
        <p className="text-stone-400 text-sm mb-4">Join BarterWithMe to make an offer — it's free.</p>
        <Link href={`/signup?next=/listings/${listingId}`} className="btn-primary w-full block text-center">
          Join to make an offer →
        </Link>
        <Link href={`/login?next=/listings/${listingId}`} className="mt-2 block text-sm text-stone-400 hover:underline">
          Already have an account? Log in
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) { setError('Describe what you\'re offering.'); return }
    setLoading(true)
    setError('')

    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, offerDescription: text }),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    router.push(`/offers/${json.offerId}`)
  }

  if (!open) {
    return (
      <div className="card bg-stone-900 border-stone-800">
        <p className="text-white font-semibold mb-1">Want to trade for this?</p>
        <p className="text-stone-400 text-sm mb-4">
          Describe what you'll offer — no money changes hands on BarterWithMe.
        </p>
        <button onClick={() => setOpen(true)} className="btn-primary w-full">
          Make an Offer →
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 border-brand-300">
      <div>
        <p className="font-semibold text-stone-800 mb-0.5">Your offer for "{listingTitle}"</p>
        <p className="text-xs text-stone-400">Text only — no photos on offers. Be specific about what you're trading.</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <textarea
        className="input resize-none"
        rows={4}
        placeholder="e.g. I can offer 6 jars of homemade salsa and 2 dozen fresh eggs from my backyard hens."
        maxLength={500}
        required
        autoFocus
        value={text}
        onChange={(e) => { setText(e.target.value); setError('') }}
      />
      <p className="text-right text-xs text-stone-400 -mt-2">{text.length}/500</p>

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Sending…' : 'Send offer →'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setText(''); setError('') }}
          className="btn-secondary px-4"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
