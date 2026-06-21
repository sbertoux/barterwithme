'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type ListingTypeValue = 'item' | 'service_onetime' | 'service_recurring' | 'recurring_goods'
type TopCard = 'item' | 'service' | 'recurring_goods'

const TOP_CARDS: { value: TopCard; label: string; icon: string; description: string }[] = [
  { value: 'item',            label: 'Item',           icon: '📦', description: 'One-time trade. Mark as traded when done.' },
  { value: 'service',         label: 'Service',        icon: '🔨', description: 'A skill or labour — one-time or ongoing.' },
  { value: 'recurring_goods', label: 'Recurring Goods',icon: '🔄', description: 'Available regularly — produce, eggs, honey, etc.' },
]

const SERVICE_KINDS: { value: ListingTypeValue; label: string; description: string }[] = [
  { value: 'service_onetime',   label: 'One-time',          description: 'A single job or session. Hides from Browse once accepted.' },
  { value: 'service_recurring', label: 'Ongoing / recurring', description: 'Repeatable. Stays active through multiple accepted offers.' },
]

function toTopCard(t: ListingTypeValue): TopCard {
  if (t === 'service_onetime' || t === 'service_recurring') return 'service'
  return t
}

const CATEGORIES = [
  { id: 1, name: 'Food & Garden',          icon: '🌱' },
  { id: 2, name: 'Skills & Labor',         icon: '🔨' },
  { id: 3, name: 'Household & Tools',      icon: '🏠' },
  { id: 4, name: 'Animals & Livestock',    icon: '🐄' },
  { id: 5, name: 'Professional Services',  icon: '💼' },
  { id: 6, name: 'Handmade & Crafts',      icon: '🧶' },
  { id: 7, name: 'Transportation & Hauling', icon: '🚛' },
  { id: 8, name: 'Valuables & Collectibles', icon: '✨' },
  { id: 9, name: 'Other',                  icon: '📦' },
]

const MAX_PHOTOS = 4
const MAX_FILE_SIZE = 5 * 1024 * 1024

interface ListingData {
  id: string
  title: string
  description: string
  listing_type: ListingTypeValue
  category_id: number
  open_to: string
  photos: string[]
  region: string
  status: string
}

interface Props {
  listing: ListingData
}

export function EditListingForm({ listing }: Props) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Field state — seeded from existing listing
  const [topCard, setTopCard] = useState<TopCard>(toTopCard(listing.listing_type))
  const [listingType, setListingType] = useState<ListingTypeValue>(listing.listing_type)
  const [categoryId, setCategoryId] = useState<number>(listing.category_id)
  const [title, setTitle] = useState(listing.title)
  const [description, setDescription] = useState(listing.description)
  const [openTo, setOpenTo] = useState(listing.open_to)

  // Existing photos: URLs already in Supabase. Removing one adds it to pendingDeletes.
  const [existingPhotos, setExistingPhotos] = useState<string[]>(listing.photos)
  const [pendingDeletes, setPendingDeletes] = useState<string[]>([])

  // New photos: File objects chosen this session
  const [newPhotos, setNewPhotos] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])

  const totalPhotos = existingPhotos.length + newPhotos.length

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // ── Photo helpers ──────────────────────────────────────────

  function removeExistingPhoto(url: string) {
    setExistingPhotos((prev) => prev.filter((u) => u !== url))
    setPendingDeletes((prev) => [...prev, url])
  }

  function removeNewPhoto(index: number) {
    URL.revokeObjectURL(newPreviews[index])
    setNewPhotos((prev) => prev.filter((_, i) => i !== index))
    setNewPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const slots = MAX_PHOTOS - totalPhotos
    const toAdd = files.slice(0, slots)

    const oversized = toAdd.filter((f) => f.size > MAX_FILE_SIZE)
    if (oversized.length > 0) {
      setError(`Each photo must be under 5 MB. ${oversized.map((f) => f.name).join(', ')} is too large.`)
      return
    }

    setNewPhotos((prev) => [...prev, ...toAdd])
    setNewPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))])
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function uploadPhoto(file: File): Promise<string> {
    const body = new FormData()
    body.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body })
    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error ?? 'Photo upload failed.')
    }
    const { url } = await res.json()
    return url
  }

  function storagePathFromUrl(url: string): string | null {
    const marker = '/storage/v1/object/public/listing-photos/'
    const idx = url.indexOf(marker)
    return idx >= 0 ? url.slice(idx + marker.length) : null
  }

  // ── Submit ─────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Title is required.'); return }
    if (!description.trim()) { setError('Description is required.'); return }

    setSaving(true)
    try {
      // Delete removed photos from storage (best-effort — don't block save on failure)
      if (pendingDeletes.length > 0) {
        const paths = pendingDeletes.map(storagePathFromUrl).filter(Boolean) as string[]
        if (paths.length > 0) {
          await supabase.storage.from('listing-photos').remove(paths).catch(() => {})
        }
      }

      // Upload new photos
      let uploadedUrls: string[] = []
      if (newPhotos.length > 0) {
        setSaveStatus(`Uploading photos… (0/${newPhotos.length})`)
        uploadedUrls = await Promise.all(
          newPhotos.map(async (file, i) => {
            const url = await uploadPhoto(file)
            setSaveStatus(`Uploading photos… (${i + 1}/${newPhotos.length})`)
            return url
          })
        )
      }

      setSaveStatus('Saving…')

      const finalPhotos = [...existingPhotos, ...uploadedUrls]

      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title: title.trim(),
          description: description.trim(),
          category_id: categoryId,
          listing_type: listingType,
          open_to: openTo.trim() || null,
          photos: finalPhotos,
          updated_at: new Date().toISOString(),
        })
        .eq('id', listing.id)

      if (updateError) throw new Error(updateError.message)

      window.location.href = `/listings/${listing.id}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setSaving(false)
      setSaveStatus('')
    }
  }

  // ── Delete listing ─────────────────────────────────────────

  async function handleDelete() {
    setDeleting(true)
    try {
      // Remove all photos from storage
      const allPhotos = [...listing.photos]
      const paths = allPhotos.map(storagePathFromUrl).filter(Boolean) as string[]
      if (paths.length > 0) {
        await supabase.storage.from('listing-photos').remove(paths).catch(() => {})
      }

      const { error } = await supabase.from('listings').delete().eq('id', listing.id)
      if (error) throw new Error(error.message)

      window.location.href = '/profile'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed.')
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {/* Listing type */}
        <fieldset>
          <legend className="label mb-3 text-base">What are you listing?</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {TOP_CARDS.map((card) => (
              <button
                key={card.value}
                type="button"
                onClick={() => {
                  setTopCard(card.value)
                  if (card.value === 'item') setListingType('item')
                  else if (card.value === 'recurring_goods') setListingType('recurring_goods')
                  // service: keep existing or reset until sub-question answered
                  else if (topCard !== 'service') setListingType('service_onetime')
                }}
                className={cn(
                  'flex flex-col items-start rounded-xl border p-4 text-left transition-all',
                  topCard === card.value
                    ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-400/30'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                )}
              >
                <span className="mb-2 text-2xl">{card.icon}</span>
                <span className="text-sm font-semibold text-stone-800">{card.label}</span>
                <span className="mt-0.5 text-xs text-stone-500">{card.description}</span>
              </button>
            ))}
          </div>

          {/* Service sub-question */}
          {topCard === 'service' && (
            <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50 p-4">
              <p className="text-sm font-medium text-stone-700 mb-3">Is this a one-time service or ongoing/recurring?</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SERVICE_KINDS.map((kind) => (
                  <button
                    key={kind.value}
                    type="button"
                    onClick={() => setListingType(kind.value)}
                    className={cn(
                      'flex flex-col items-start rounded-lg border p-3 text-left transition-all',
                      listingType === kind.value
                        ? 'border-brand-400 bg-white ring-2 ring-brand-400/30'
                        : 'border-brand-200 bg-white hover:border-brand-300'
                    )}
                  >
                    <span className="text-sm font-semibold text-stone-800">{kind.label}</span>
                    <span className="text-xs text-stone-500 mt-0.5">{kind.description}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        {/* Category */}
        <fieldset>
          <legend className="label mb-3 text-base">Category</legend>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={cn(
                  'flex flex-col items-center rounded-xl border px-2 py-3 text-center transition-all',
                  categoryId === cat.id
                    ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-400/30'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                )}
              >
                <span className="mb-1 text-xl">{cat.icon}</span>
                <span className="text-xs font-medium leading-tight text-stone-700">{cat.name}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Title */}
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            className="input"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className="mt-1 text-right text-xs text-stone-400">{title.length}/100</p>
        </div>

        {/* Description */}
        <div>
          <label className="label" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="input resize-none"
            rows={4}
            required
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <p className="mt-1 text-right text-xs text-stone-400">{description.length}/1000</p>
        </div>

        {/* Open to receiving */}
        <div>
          <label className="label" htmlFor="openTo">
            I'm open to receiving{' '}
            <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <input
            id="openTo"
            type="text"
            className="input"
            maxLength={200}
            placeholder="Leave blank if open to any offer"
            value={openTo}
            onChange={(e) => setOpenTo(e.target.value)}
          />
        </div>

        {/* Photos */}
        <div>
          <label className="label">
            Photos{' '}
            <span className="font-normal text-stone-400">(up to {MAX_PHOTOS})</span>
          </label>

          {(existingPhotos.length > 0 || newPreviews.length > 0) && (
            <div className="mb-3 grid grid-cols-4 gap-2">
              {existingPhotos.map((url) => (
                <div key={url} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full rounded-xl object-cover border border-stone-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingPhoto(url)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-xs text-white transition-colors hover:bg-red-600"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
              {newPreviews.map((src, i) => (
                <div key={src} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    className="h-full w-full rounded-xl object-cover border-2 border-brand-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewPhoto(i)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-xs text-white transition-colors hover:bg-red-600"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                  <span className="absolute bottom-1 left-1 rounded bg-brand-500 px-1 text-[10px] font-medium text-white">
                    New
                  </span>
                </div>
              ))}
            </div>
          )}

          {totalPhotos < MAX_PHOTOS && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 py-6 text-sm text-stone-400 transition-colors hover:border-brand-300 hover:text-brand-500"
              >
                <span className="text-xl">📷</span>
                {totalPhotos === 0 ? 'Add photos' : `Add more (${totalPhotos}/${MAX_PHOTOS})`}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </>
          )}
        </div>

        {/* Region (read-only) */}
        <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
          <span className="text-sm text-stone-500">Region</span>
          <span className="text-sm font-medium text-stone-800">{listing.region}</span>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full py-4 text-base"
        >
          {saving ? saveStatus || 'Saving…' : 'Save changes →'}
        </button>
      </form>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-100 bg-red-50 p-4">
        <p className="mb-1 text-sm font-semibold text-red-700">Danger zone</p>
        <p className="mb-3 text-xs text-red-500">
          Deleting a listing is permanent. Photos are removed from storage.
        </p>
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            Delete listing
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-red-700">Are you sure?</p>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="text-sm text-stone-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
