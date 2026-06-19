'use client'

import { useState } from 'react'

export function FallbackConfirmButton({ tradeId }: { tradeId: string }) {
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (confirmed) {
    return (
      <p className="text-xs text-stone-500">You confirmed. Waiting for the other party.</p>
    )
  }

  async function handleConfirm() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/trades/${tradeId}/confirm`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setConfirmed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs text-red-600">{error}</p>}
      <button
        onClick={handleConfirm}
        disabled={loading}
        className="btn-primary w-full text-sm disabled:opacity-40"
      >
        {loading ? 'Confirming…' : 'Confirm trade complete →'}
      </button>
    </div>
  )
}
