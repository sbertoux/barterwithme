'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { slug: 'food-garden',           name: 'Food & Garden',          icon: '🌱' },
  { slug: 'skills-labor',          name: 'Skills & Labor',         icon: '🔨' },
  { slug: 'household-tools',       name: 'Household & Tools',      icon: '🏠' },
  { slug: 'animals-livestock',     name: 'Animals & Livestock',    icon: '🐄' },
  { slug: 'professional-services', name: 'Professional Services',  icon: '💼' },
  { slug: 'handmade-crafts',       name: 'Handmade & Crafts',      icon: '🧶' },
  { slug: 'transportation',        name: 'Transportation',         icon: '🚛' },
  { slug: 'valuables-collectibles',name: 'Valuables',              icon: '✨' },
  { slug: 'other',                 name: 'Other',                  icon: '📦' },
]

interface Props {
  initialQ: string
  initialCategory: string
  initialRegion: string
  regions: string[]
}

export function BrowseFilters({ initialQ, initialCategory, initialRegion, regions }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(initialQ)

  function push(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    // Scroll back to top on filter change
    window.scrollTo(0, 0)
    router.push(`/browse?${params.toString()}`)
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    push({ q: q.trim() || null })
  }

  function toggleCategory(slug: string) {
    push({ category: initialCategory === slug ? null : slug })
  }

  return (
    <div className="mb-5 space-y-3">
      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="search"
          className="input flex-1"
          placeholder="Search by what's offered or what they're seeking…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0 px-5">
          Search
        </button>
      </form>

      {/* Category pills */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => push({ category: null })}
          className={cn(
            'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
            !initialCategory
              ? 'bg-brand-500 text-white'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          )}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => toggleCategory(cat.slug)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              initialCategory === cat.slug
                ? 'bg-brand-500 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            )}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Region */}
      {regions.length > 1 && (
        <select
          value={initialRegion}
          onChange={(e) => push({ region: e.target.value || null })}
          className="input w-full sm:w-64"
        >
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
