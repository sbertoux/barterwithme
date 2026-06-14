'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  from_user_id: string
  content: string
  created_at: string
}

interface Trade {
  id: string
  confirmed_by_lister: boolean
  confirmed_by_trader: boolean
  completed_at: string | null
}

interface Props {
  offerId: string
  status: string
  currentUserId: string
  listerId: string
  traderId: string
  listerUsername: string
  traderUsername: string
  listingTitle: string
  initialMessages: Message[]
  trade: Trade | null
}

export function OfferThread({
  offerId, status: initialStatus, currentUserId,
  listerId, traderId, listerUsername, traderUsername,
  listingTitle, initialMessages, trade: initialTrade,
}: Props) {
  const supabase = createClient()
  const isLister = currentUserId === listerId
  const isTrader = currentUserId === traderId
  const otherUsername = isLister ? traderUsername : listerUsername
  const bottomRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [status, setStatus] = useState(initialStatus)
  const [trade, setTrade] = useState<Trade | null>(initialTrade)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [acting, setActing] = useState(false)
  const [storyText, setStoryText] = useState('')
  const [storySubmitted, setStorySubmitted] = useState(false)
  const [error, setError] = useState('')

  const isComplete = !!trade?.completed_at
  const iClosed = ['declined', 'withdrawn'].includes(status)
  const myConfirmed = isLister ? trade?.confirmed_by_lister : trade?.confirmed_by_trader
  const theyConfirmed = isLister ? trade?.confirmed_by_trader : trade?.confirmed_by_lister

  // Realtime message subscription
  useEffect(() => {
    const channel = supabase
      .channel(`offer-${offerId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `offer_id=eq.${offerId}`,
      }, (payload) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === (payload.new as Message).id)) return prev
          return [...prev, payload.new as Message]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [offerId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function apiPost(path: string, body?: object) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Request failed')
    return json
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    setError('')
    try {
      const msg = await apiPost('/api/messages', { offerId, content: draft.trim() })
      setDraft('')
      // Optimistic add (realtime will dedupe)
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg])
      if (status === 'pending' && isLister) setStatus('countered')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  async function accept() {
    setActing(true)
    setError('')
    try {
      await apiPost(`/api/offers/${offerId}/accept`)
      setStatus('accepted')
      // Trade will be created server-side; reload to get trade ID
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
      setActing(false)
    }
  }

  async function decline() {
    if (!confirm('Decline this offer?')) return
    setActing(true)
    setError('')
    try {
      await apiPost(`/api/offers/${offerId}/decline`)
      setStatus('declined')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setActing(false)
    }
  }

  async function withdraw() {
    if (!confirm('Withdraw your offer?')) return
    setActing(true)
    setError('')
    try {
      await apiPost(`/api/offers/${offerId}/withdraw`)
      setStatus('withdrawn')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setActing(false)
    }
  }

  async function confirmTrade() {
    if (!trade) return
    setActing(true)
    setError('')
    try {
      const updated = await apiPost(`/api/trades/${trade.id}/confirm`)
      setTrade(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setActing(false)
    }
  }

  async function submitStory(e: React.FormEvent) {
    e.preventDefault()
    if (!trade || !storyText.trim()) return
    try {
      await apiPost(`/api/trades/${trade.id}/story`, { storyText })
      setStorySubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save story')
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700',
    countered: 'bg-sky-50 text-sky-700',
    accepted: 'bg-green-50 text-green-700',
    declined: 'bg-stone-100 text-stone-400',
    withdrawn: 'bg-stone-100 text-stone-400',
  }

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm ${statusColors[status] ?? ''}`}>
        <span className="font-medium capitalize">{status}</span>
        {/* Lister actions */}
        {isLister && ['pending', 'countered'].includes(status) && (
          <div className="flex gap-2">
            <button onClick={decline} disabled={acting} className="rounded-lg border border-red-200 bg-white px-3 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
              Decline
            </button>
            <button onClick={accept} disabled={acting} className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-40">
              Accept →
            </button>
          </div>
        )}
        {/* Trader actions */}
        {isTrader && ['pending', 'countered'].includes(status) && (
          <button onClick={withdraw} disabled={acting} className="rounded-lg border border-stone-200 bg-white px-3 py-1 text-xs text-stone-500 hover:bg-stone-100 transition-colors disabled:opacity-40">
            Withdraw offer
          </button>
        )}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      {/* Closed state */}
      {iClosed && (
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">{status === 'declined' ? '🚫' : '↩️'}</p>
          <p className="font-semibold text-stone-600 capitalize">Offer {status}</p>
          <a href="/browse" className="btn-secondary mt-4 inline-block text-sm">Browse more listings →</a>
        </div>
      )}

      {/* Message thread */}
      {!iClosed && (
        <>
          {/* Trade confirmation */}
          {status === 'accepted' && trade && (
            <div className={`card border ${isComplete ? 'bg-green-50 border-green-200' : 'border-brand-200 bg-brand-50'}`}>
              {isComplete ? (
                <div className="text-center">
                  <p className="text-2xl mb-1">🎉</p>
                  <p className="font-semibold text-green-800">Trade complete!</p>
                  <p className="text-xs text-green-600 mt-0.5">Both parties confirmed. Nice work.</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-stone-800 text-sm mb-1">Has the trade happened?</p>
                  <p className="text-xs text-stone-500 mb-3">
                    {myConfirmed
                      ? `You confirmed. Waiting for @${otherUsername} to confirm.`
                      : theyConfirmed
                        ? `@${otherUsername} already confirmed. Your turn.`
                        : 'When both parties confirm, the trade is complete.'}
                  </p>
                  {!myConfirmed && (
                    <button onClick={confirmTrade} disabled={acting} className="btn-primary w-full text-sm">
                      {acting ? 'Confirming…' : 'Confirm trade complete →'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Trade story prompt */}
          {isComplete && !storySubmitted && (
            <div className="card border-stone-200">
              <p className="font-semibold text-stone-800 text-sm mb-1">Share your trade story?</p>
              <p className="text-xs text-stone-400 mb-3">
                Optional. No names — just what was exchanged. Shows up on the public stories feed to inspire others.
              </p>
              <form onSubmit={submitStory} className="space-y-3">
                <input
                  type="text"
                  className="input text-sm"
                  placeholder={`e.g. Fresh eggs for homemade jam — ${/* region from listing title */ ''}`}
                  maxLength={120}
                  value={storyText}
                  onChange={(e) => setStoryText(e.target.value)}
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary text-sm flex-1" disabled={!storyText.trim()}>
                    Share story →
                  </button>
                  <button type="button" onClick={() => setStorySubmitted(true)} className="btn-secondary text-sm px-4">
                    Skip
                  </button>
                </div>
              </form>
            </div>
          )}
          {isComplete && storySubmitted && storyText && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              Story shared! It'll appear on the <a href="/stories" className="underline">stories feed</a>.
            </div>
          )}

          {/* Messages */}
          <div className="min-h-[200px] space-y-2">
            {messages.length === 0 && status !== 'accepted' && (
              <p className="py-8 text-center text-sm text-stone-400">
                No messages yet.{' '}
                {isLister
                  ? 'You can message to discuss before accepting or declining.'
                  : 'The owner can message you to discuss.'}
              </p>
            )}
            {messages.length === 0 && status === 'accepted' && (
              <p className="py-8 text-center text-sm text-stone-400">
                Offer accepted! Message @{otherUsername} to arrange your trade.
              </p>
            )}
            {messages.map((msg) => {
              const mine = msg.from_user_id === currentUserId
              const sender = msg.from_user_id === listerId ? listerUsername : traderUsername
              return (
                <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-stone-100 text-stone-800 rounded-bl-sm'}`}>
                    {!mine && <p className="mb-0.5 text-xs font-medium opacity-60">@{sender}</p>}
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={`mt-1 text-right text-[10px] ${mine ? 'opacity-60' : 'text-stone-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Message input */}
          {!isComplete && (
            <form onSubmit={sendMessage} className="flex gap-2 sticky bottom-20 sm:bottom-4 bg-stone-50 pt-2 pb-1">
              <input
                type="text"
                className="input flex-1 text-sm"
                placeholder={`Message @${otherUsername}…`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={1000}
              />
              <button type="submit" disabled={sending || !draft.trim()} className="btn-primary px-4 shrink-0 text-sm">
                {sending ? '…' : 'Send'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  )
}
