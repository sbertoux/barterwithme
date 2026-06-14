'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface SwipeOffer {
  id: string
  offerDescription: string
  fromUsername: string
  listingTitle: string
}

interface Props {
  offers: SwipeOffer[]
}

const THRESHOLD = 90

export function SwipeDeck({ offers }: Props) {
  const router = useRouter()
  const [index, setIndex] = useState(0)
  const [offset, setOffset] = useState(0)
  const [acting, setActing] = useState(false)
  const startX = useRef(0)
  const dragging = useRef(false)

  if (index >= offers.length) {
    return (
      <div className="card flex flex-col items-center py-10 text-center">
        <p className="text-2xl mb-2">✅</p>
        <p className="font-semibold text-stone-700 text-sm">All caught up</p>
        <p className="text-xs text-stone-400 mt-1">All pending offers have been reviewed.</p>
      </div>
    )
  }

  const offer = offers[index]
  const acceptProgress = Math.min(1, Math.max(0, offset / THRESHOLD))
  const declineProgress = Math.min(1, Math.max(0, -offset / THRESHOLD))

  async function act(direction: 'accept' | 'decline') {
    if (acting) return
    setActing(true)
    const finalOffset = direction === 'accept' ? 400 : -400
    setOffset(finalOffset)

    await fetch(`/api/offers/${offer.id}/${direction}`, { method: 'POST' })

    setTimeout(() => {
      setIndex((i) => i + 1)
      setOffset(0)
      setActing(false)
      router.refresh()
    }, 280)
  }

  return (
    <div>
      {/* Card stack hint */}
      {offers.length - index > 1 && (
        <div className="relative mb-[-8px] mx-3 h-4 rounded-t-2xl border border-stone-200 bg-stone-100" />
      )}

      {/* Swipeable card */}
      <div
        style={{
          transform: `translateX(${offset}px) rotate(${offset * 0.04}deg)`,
          transition: acting ? 'transform 0.28s ease-out' : 'none',
          userSelect: 'none',
          touchAction: 'none',
        }}
        onPointerDown={(e) => {
          if (acting) return
          startX.current = e.clientX
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return
          setOffset(e.clientX - startX.current)
        }}
        onPointerUp={() => {
          if (!dragging.current) return
          dragging.current = false
          if (offset > THRESHOLD) act('accept')
          else if (offset < -THRESHOLD) act('decline')
          else setOffset(0)
        }}
        className="card relative cursor-grab active:cursor-grabbing"
      >
        {/* Accept indicator */}
        {acceptProgress > 0 && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-start rounded-2xl pl-6"
            style={{ opacity: acceptProgress }}
          >
            <span className="rounded-full border-4 border-green-500 px-4 py-1 text-xl font-black text-green-500 rotate-[-15deg]">
              ACCEPT
            </span>
          </div>
        )}
        {/* Decline indicator */}
        {declineProgress > 0 && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-end rounded-2xl pr-6"
            style={{ opacity: declineProgress }}
          >
            <span className="rounded-full border-4 border-red-500 px-4 py-1 text-xl font-black text-red-500 rotate-[15deg]">
              PASS
            </span>
          </div>
        )}

        <p className="mb-1 text-xs text-stone-400">{offer.listingTitle}</p>
        <p className="mb-3 font-semibold text-stone-800">
          Offer from <span className="text-brand-600">@{offer.fromUsername}</span>
        </p>
        <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-700 leading-relaxed">
          {offer.offerDescription}
        </p>

        {/* Progress counter */}
        <p className="mt-4 text-center text-xs text-stone-300">
          {index + 1} of {offers.length}
        </p>
      </div>

      {/* Buttons (always visible — swipe is enhancement) */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          onClick={() => act('decline')}
          disabled={acting}
          className="flex flex-col items-center rounded-xl border border-red-200 bg-white py-3 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
        >
          <span className="text-xl">✕</span>
          <span className="text-xs mt-0.5 font-medium">Pass</span>
        </button>
        <a
          href={`/offers/${offer.id}`}
          className="flex flex-col items-center rounded-xl border border-stone-200 bg-white py-3 text-stone-500 hover:bg-stone-50 transition-colors text-center"
        >
          <span className="text-xl">💬</span>
          <span className="text-xs mt-0.5 font-medium">Message</span>
        </a>
        <button
          onClick={() => act('accept')}
          disabled={acting}
          className="flex flex-col items-center rounded-xl border border-green-200 bg-white py-3 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-40"
        >
          <span className="text-xl">✓</span>
          <span className="text-xs mt-0.5 font-medium">Accept</span>
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-stone-300">← swipe to pass · swipe to accept →</p>
    </div>
  )
}
