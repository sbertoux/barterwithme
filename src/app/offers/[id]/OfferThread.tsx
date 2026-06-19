'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  from_user_id: string
  content: string
  created_at: string
  read_at: string | null
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
  listingId: string
  listingType: string
  isListingPaused: boolean
  traderId: string
  listerUsername: string
  traderUsername: string
  listingTitle: string
  offerDescription: string
  initialListerContact: string | null
  initialTraderContact: string | null
  initialMessages: Message[]
  trade: Trade | null
}

export function OfferThread({
  offerId, status: initialStatus, currentUserId,
  listerId, listingId, listingType, isListingPaused: initialPaused,
  traderId, listerUsername, traderUsername,
  listingTitle, offerDescription, initialListerContact, initialTraderContact,
  initialMessages, trade: initialTrade,
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
  const [noteText, setNoteText] = useState('')
  const [storySubmitted, setStorySubmitted] = useState(false)
  const [error, setError] = useState('')

  // Post-trade feedback
  const [feedbackChoice, setFeedbackChoice] = useState<'vouch' | 'flag' | null>(null)
  const [vouchNote, setVouchNote] = useState('')
  const [vouchDone, setVouchDone] = useState(false)
  const [submittingVouch, setSubmittingVouch] = useState(false)
  const [flagReason, setFlagReason] = useState('')
  const [flagDetails, setFlagDetails] = useState('')
  const [flagDone, setFlagDone] = useState(false)
  const [submittingFlag, setSubmittingFlag] = useState(false)

  // Contact sharing
  const [listerContact, setListerContact] = useState(initialListerContact)
  const [traderContact, setTraderContact] = useState(initialTraderContact)
  const [contactDraft, setContactDraft] = useState('')
  const [showContactInput, setShowContactInput] = useState(false)
  const [sharingContact, setSharingContact] = useState(false)

  // Listing pause
  const [isPaused, setIsPaused] = useState(initialPaused)
  const [togglingPause, setTogglingPause] = useState(false)

  const myContact = isLister ? listerContact : traderContact
  const theirContact = isLister ? traderContact : listerContact

  const isComplete = !!trade?.completed_at
  const iClosed = ['declined', 'withdrawn'].includes(status)
  const myConfirmed = isLister ? trade?.confirmed_by_lister : trade?.confirmed_by_trader
  const theyConfirmed = isLister ? trade?.confirmed_by_trader : trade?.confirmed_by_lister

  // Mark thread as seen on mount
  useEffect(() => {
    fetch(`/api/offers/${offerId}/seen`, { method: 'POST' }).catch(() => {})
  }, [offerId])

  // Realtime message subscription
  useEffect(() => {
    const channel = supabase
      .channel(`offer-${offerId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `offer_id=eq.${offerId}`,
      }, (payload) => {
        const incoming = payload.new as Message
        setMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev
          return [...prev, { ...incoming, read_at: null }]
        })
        fetch(`/api/offers/${offerId}/seen`, { method: 'POST' }).catch(() => {})
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [offerId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const firstUnreadIndex = messages.findIndex(
    (m) => m.from_user_id !== currentUserId && m.read_at === null
  )

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
      setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, { ...msg, read_at: null }])
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
    if (!trade) return
    try {
      await apiPost(`/api/trades/${trade.id}/story`, { noteText: noteText.trim() || null })
      setStorySubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save story')
    }
  }

  async function submitVouch(e: React.FormEvent) {
    e.preventDefault()
    if (!trade || submittingVouch) return
    setSubmittingVouch(true)
    setError('')
    try {
      const res = await fetch(`/api/trades/${trade.id}/vouch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: vouchNote.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok && json.error !== 'already_vouched') throw new Error(json.error ?? 'Failed')
      setVouchDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit vouch')
    } finally {
      setSubmittingVouch(false)
    }
  }

  async function submitFlag(e: React.FormEvent) {
    e.preventDefault()
    if (!trade || !flagReason || submittingFlag) return
    setSubmittingFlag(true)
    setError('')
    try {
      const res = await fetch(`/api/trades/${trade.id}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: flagReason, details: flagDetails.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok && json.error !== 'already_flagged') throw new Error(json.error ?? 'Failed')
      setFlagDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report')
    } finally {
      setSubmittingFlag(false)
    }
  }

  async function shareContact(e: React.FormEvent) {
    e.preventDefault()
    if (!contactDraft.trim() || sharingContact) return
    setSharingContact(true)
    setError('')
    try {
      await apiPost(`/api/offers/${offerId}/share-contact`, { contactInfo: contactDraft.trim() })
      if (isLister) setListerContact(contactDraft.trim())
      else setTraderContact(contactDraft.trim())
      setContactDraft('')
      setShowContactInput(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share contact')
    } finally {
      setSharingContact(false)
    }
  }

  async function togglePause() {
    setTogglingPause(true)
    setError('')
    try {
      await apiPost(`/api/listings/${listingId}/pause`, { paused: !isPaused })
      setIsPaused((p) => !p)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing')
    } finally {
      setTogglingPause(false)
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
        {isTrader && ['pending', 'countered'].includes(status) && (
          <button onClick={withdraw} disabled={acting} className="rounded-lg border border-stone-200 bg-white px-3 py-1 text-xs text-stone-500 hover:bg-stone-100 transition-colors disabled:opacity-40">
            Withdraw offer
          </button>
        )}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>}

      {iClosed && (
        <div className="card text-center py-8">
          <p className="text-2xl mb-2">{status === 'declined' ? '🚫' : '↩️'}</p>
          <p className="font-semibold text-stone-600 capitalize">Offer {status}</p>
          <a href="/browse" className="btn-secondary mt-4 inline-block text-sm">Browse more listings →</a>
        </div>
      )}

      {!iClosed && (
        <>
          {status === 'accepted' && trade && (
            <div className={`card border ${isComplete ? 'bg-green-50 border-green-200' : 'border-brand-200 bg-brand-50'}`}>
              {isComplete ? (
                <div className="text-center">
                  <p className="text-2xl mb-1">🎉</p>
                  <p className="font-semibold text-green-800">Trade complete!</p>
                  <p className="text-xs text-green-600 mt-0.5">Both parties confirmed. Nice work.</p>
                </div>
              ) : (
                <div className="space-y-3">
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

                  {/* Listing pause — lister only, one-time types only, shown until they confirm */}
                  {isLister && !myConfirmed && ['item', 'service_onetime'].includes(listingType) && (
                    <div className="border-t border-brand-100 pt-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-stone-700">
                            {isPaused ? 'Listing is paused' : 'Pause this listing?'}
                          </p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            {isPaused
                              ? 'Hidden from Browse while you finalise. Unpause anytime.'
                              : 'Hides it from Browse while you finalise this trade.'}
                          </p>
                        </div>
                        <button
                          onClick={togglePause}
                          disabled={togglingPause}
                          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40 ${
                            isPaused
                              ? 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                              : 'border-brand-200 bg-brand-600 text-white hover:bg-brand-700'
                          }`}
                        >
                          {togglingPause ? '…' : isPaused ? 'Unpause' : 'Pause'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isComplete && !storySubmitted && (
            <div className="card border-stone-200">
              <p className="font-semibold text-stone-800 text-sm mb-1">Share your trade story?</p>
              <p className="text-xs text-stone-400 mb-3">
                Shows up on the public stories feed — no names, just what was exchanged.
              </p>
              <form onSubmit={submitStory} className="space-y-3">
                {/* Auto-generated trade summary — read-only */}
                <div className="rounded-xl bg-stone-100 px-3 py-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400 mb-0.5">Trade summary</p>
                  <p className="text-sm font-medium text-stone-700">
                    {offerDescription} for &ldquo;{listingTitle}&rdquo;
                  </p>
                </div>
                <textarea
                  className="input w-full resize-none text-sm"
                  placeholder="Add a personal note… (optional)"
                  rows={2}
                  maxLength={200}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary text-sm flex-1">
                    Share story →
                  </button>
                  <button type="button" onClick={() => setStorySubmitted(true)} className="btn-secondary text-sm px-4">
                    Skip
                  </button>
                </div>
              </form>
            </div>
          )}
          {isComplete && storySubmitted && (
            <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              Story shared! It&apos;ll appear on the <a href="/stories" className="underline">stories feed</a>.
            </div>
          )}

          {/* Post-trade feedback */}
          {isComplete && !vouchDone && !flagDone && (
            <div className="card border-stone-200">
              <p className="text-sm font-semibold text-stone-800 mb-1">
                How did it go with @{otherUsername}?
              </p>
              <p className="text-xs text-stone-400 mb-3">Optional — one vouch or report per trade.</p>
              {feedbackChoice === null && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setFeedbackChoice('vouch')}
                    className="btn-primary flex-1 text-sm"
                  >
                    Vouch for them
                  </button>
                  <button
                    onClick={() => setFeedbackChoice('flag')}
                    className="flex-1 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Report issue
                  </button>
                </div>
              )}
              {feedbackChoice === 'vouch' && (
                <form onSubmit={submitVouch} className="space-y-3">
                  <textarea
                    className="input w-full resize-none text-sm"
                    placeholder="Optional: say something about the trade (shown on their public profile)"
                    rows={2}
                    maxLength={200}
                    value={vouchNote}
                    onChange={(e) => setVouchNote(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submittingVouch}
                      className="btn-primary flex-1 text-sm"
                    >
                      {submittingVouch ? 'Submitting…' : 'Submit vouch →'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackChoice(null)}
                      className="btn-secondary px-4 text-sm"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
              {feedbackChoice === 'flag' && (
                <form onSubmit={submitFlag} className="space-y-3">
                  <select
                    className="input w-full text-sm"
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    required
                  >
                    <option value="">Select a reason…</option>
                    <option value="not_as_described">Item / service not as described</option>
                    <option value="no_show">No-show or ghosted</option>
                    <option value="inappropriate_behavior">Inappropriate behavior</option>
                    <option value="suspected_fraud">Suspected fraud</option>
                    <option value="other">Other</option>
                  </select>
                  <textarea
                    className="input w-full resize-none text-sm"
                    placeholder="Optional: additional details (private, seen only by admins)"
                    rows={2}
                    maxLength={500}
                    value={flagDetails}
                    onChange={(e) => setFlagDetails(e.target.value)}
                  />
                  <p className="text-[10px] text-stone-400">Your report is anonymous and reviewed by admins.</p>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submittingFlag || !flagReason}
                      className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-40"
                    >
                      {submittingFlag ? 'Submitting…' : 'Submit report'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedbackChoice(null)}
                      className="btn-secondary px-4 text-sm"
                    >
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
          {isComplete && (vouchDone || flagDone) && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {vouchDone
                ? 'Vouch submitted! Thanks for supporting the community.'
                : 'Report submitted. Our team will review it.'}
            </div>
          )}

          {/* Contact sharing */}
          <div className="card border-stone-200 space-y-3">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">Contact info</p>

            {/* Other party's shared contact */}
            {theirContact ? (
              <div className="rounded-lg bg-stone-50 border border-stone-200 px-3 py-2.5">
                <p className="text-xs text-stone-400 mb-0.5">@{otherUsername} shared</p>
                <p className="text-sm font-medium text-stone-800 break-all">{theirContact}</p>
              </div>
            ) : (
              <p className="text-xs text-stone-400">@{otherUsername} hasn't shared contact info yet.</p>
            )}

            {/* My own contact */}
            {myContact ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">You shared:</span>
                <span className="text-xs font-medium text-stone-700 break-all">{myContact}</span>
              </div>
            ) : showContactInput ? (
              <form onSubmit={shareContact} className="space-y-2">
                <input
                  type="text"
                  className="input text-sm"
                  placeholder="Email, phone, Signal handle…"
                  maxLength={200}
                  value={contactDraft}
                  onChange={(e) => setContactDraft(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={sharingContact || !contactDraft.trim()} className="btn-primary text-xs flex-1">
                    {sharingContact ? 'Sharing…' : 'Share →'}
                  </button>
                  <button type="button" onClick={() => { setShowContactInput(false); setContactDraft('') }} className="btn-secondary text-xs px-3">
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] text-stone-400">
                  Only @{otherUsername} can see this. You decide what to share.
                </p>
              </form>
            ) : (
              <button onClick={() => setShowContactInput(true)} className="text-xs font-medium text-brand-600 hover:underline">
                + Share your contact info
              </button>
            )}
          </div>

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
            {messages.map((msg, i) => {
              const mine = msg.from_user_id === currentUserId
              const sender = msg.from_user_id === listerId ? listerUsername : traderUsername
              const showNewDivider = i === firstUnreadIndex && firstUnreadIndex >= 0
              return (
                <div key={msg.id}>
                  {showNewDivider && (
                    <div className="flex items-center gap-2 py-2">
                      <div className="flex-1 border-t border-brand-200" />
                      <span className="shrink-0 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                        New
                      </span>
                      <div className="flex-1 border-t border-brand-200" />
                    </div>
                  )}
                  <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-brand-500 text-white rounded-br-sm' : 'bg-stone-100 text-stone-800 rounded-bl-sm'}`}>
                      {!mine && <p className="mb-0.5 text-xs font-medium opacity-60">@{sender}</p>}
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={`mt-1 text-right text-[10px] ${mine ? 'opacity-60' : 'text-stone-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

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
