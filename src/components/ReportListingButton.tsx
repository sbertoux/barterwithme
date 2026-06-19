'use client'

import { useState } from 'react'

const REASONS = [
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'spam',                  label: 'Spam or duplicate' },
  { value: 'misleading',            label: 'Misleading or inaccurate' },
  { value: 'other',                 label: 'Other' },
]

export function ReportListingButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!reason || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/listings/${listingId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, details: details.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.error === 'already_flagged') {
          setDone(true)
          return
        }
        throw new Error(json.error ?? 'Request failed')
      }
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <p className="text-xs text-stone-400 text-center pt-2">
        Report submitted. Our team will review it.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full pt-2 text-xs text-stone-300 hover:text-stone-400 transition-colors"
      >
        Report this listing
      </button>
    )
  }

  return (
    <div className="card border-stone-200 mt-2">
      <p className="text-xs font-semibold text-stone-600 mb-3">Report this listing</p>
      <form onSubmit={submit} className="space-y-3">
        <select
          className="input text-sm w-full"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        >
          <option value="">Select a reason…</option>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <textarea
          className="input text-sm w-full resize-none"
          placeholder="Optional: additional details"
          rows={2}
          maxLength={400}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <p className="text-[10px] text-stone-400">Your report is anonymous and reviewed by admins.</p>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || !reason}
            className="btn-primary flex-1 text-xs py-2"
          >
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setReason(''); setDetails('') }}
            className="btn-secondary px-3 text-xs py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
