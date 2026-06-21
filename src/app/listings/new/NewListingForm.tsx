'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type ListingTypeValue = 'item' | 'service_onetime' | 'service_recurring' | 'recurring_goods'
type TopCard = 'item' | 'service' | 'recurring_goods'

const TOP_CARDS: { value: TopCard; label: string; icon: string; description: string }[] = [
  { value: 'item',           label: 'Item',           icon: '📦', description: 'One-time trade. Mark as traded when done.' },
  { value: 'service',        label: 'Service',        icon: '🔨', description: 'A skill or labour — one-time or ongoing.' },
  { value: 'recurring_goods',label: 'Recurring Goods',icon: '🔄', description: 'Available regularly — produce, eggs, honey, etc.' },
]

const SERVICE_KINDS: { value: ListingTypeValue; label: string; description: string }[] = [
  { value: 'service_onetime',   label: 'One-time',          description: 'A single job or session. Hides from Browse once accepted.' },
  { value: 'service_recurring', label: 'Ongoing / recurring', description: 'Repeatable. Stays active through multiple accepted offers.' },
]

const CATEGORIES = [
  { id: 1, name: 'Food & Garden', icon: '🌱' },
  { id: 2, name: 'Skills & Labor', icon: '🔨' },
  { id: 3, name: 'Household & Tools', icon: '🏠' },
  { id: 4, name: 'Animals & Livestock', icon: '🐄' },
  { id: 5, name: 'Professional Services', icon: '💼' },
  { id: 6, name: 'Handmade & Crafts', icon: '🧶' },
  { id: 7, name: 'Transportation & Hauling', icon: '🚛' },
  { id: 8, name: 'Valuables & Collectibles', icon: '✨' },
  { id: 9, name: 'Other', icon: '📦' },
]

const MAX_PHOTOS = 4
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

interface Props {
  userId: string
  region: string
}

export function NewListingForm({ userId, region }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [topCard, setTopCard] = useState<TopCard | ''>('')
  const [listingType, setListingType] = useState<ListingTypeValue | ''>('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [openTo, setOpenTo] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])

  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = MAX_PHOTOS - photos.length
    const toAdd = files.slice(0, remaining)

    const oversized = toAdd.filter((f) => f.size > MAX_FILE_SIZE)
    if (oversized.length > 0) {
      setError(`Each photo must be under 5 MB. ${oversized.map((f) => f.name).join(', ')} exceeded the limit.`)
      return
    }

    const newPreviews = toAdd.map((f) => URL.createObjectURL(f))
    setPhotos((prev) => [...prev, ...toAdd])
    setPhotoPreviews((prev) => [...prev, ...newPreviews])
    setError('')

    // Reset input so same file can be re-added if removed
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(photoPreviews[index])
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!listingType) { setError(topCard === 'service' ? 'Choose one-time or ongoing service.' : 'Choose a listing type.'); return }
    if (!categoryId) { setError('Choose a category.'); return }
    if (!title.trim()) { setError('Add a title.'); return }
    if (!description.trim()) { setError('Add a description.'); return }

    setUploading(true)

    try {
      let photoUrls: string[] = []

      if (photos.length > 0) {
        setUploadStatus(`Uploading photos… (0/${photos.length})`)
        photoUrls = await Promise.all(
          photos.map(async (file, i) => {
            const url = await uploadPhoto(file)
            setUploadStatus(`Uploading photos… (${i + 1}/${photos.length})`)
            return url
          })
        )
      }

      setUploadStatus('Saving listing…')

      const { data, error: insertError } = await supabase
        .from('listings')
        .insert({
          user_id: userId,
          title: title.trim(),
          description: description.trim(),
          category_id: categoryId,
          listing_type: listingType,
          open_to: openTo.trim() || null,
          photos: photoUrls,
          status: 'active',
          region,
        })
        .select('id')
        .single()

      if (insertError) throw new Error(insertError.message)

      router.push(`/listings/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setUploading(false)
      setUploadStatus('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Listing Type */}
      <fieldset>
        <legend className="label text-base mb-3">What are you listing?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {TOP_CARDS.map((card) => {
            const isActive = topCard === card.value
            return (
              <button
                key={card.value}
                type="button"
                onClick={() => {
                  setTopCard(card.value)
                  if (card.value === 'item') setListingType('item')
                  else if (card.value === 'recurring_goods') setListingType('recurring_goods')
                  else setListingType('')
                }}
                className={cn(
                  'flex flex-col items-start rounded-xl border p-4 text-left transition-all',
                  isActive
                    ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-400/30'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                )}
              >
                <span className="text-2xl mb-2">{card.icon}</span>
                <span className="font-semibold text-stone-800 text-sm">{card.label}</span>
                <span className="text-xs text-stone-500 mt-0.5">{card.description}</span>
              </button>
            )
          })}
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
        <legend className="label text-base mb-3">Category</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={cn(
                'flex flex-col items-center rounded-xl border py-3 px-2 text-center transition-all',
                categoryId === cat.id
                  ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-400/30'
                  : 'border-stone-200 bg-white hover:border-stone-300'
              )}
            >
              <span className="text-xl mb-1">{cat.icon}</span>
              <span className="text-xs font-medium text-stone-700 leading-tight">{cat.name}</span>
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
          placeholder="e.g. Fresh eggs from backyard hens"
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
          placeholder="Describe what you're offering. Condition, quantity, availability — whatever helps someone decide."
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
          placeholder="e.g. Garden produce, homemade goods, help with yardwork — or leave blank if open to any offer"
          maxLength={200}
          value={openTo}
          onChange={(e) => setOpenTo(e.target.value)}
        />
      </div>

      {/* Photos */}
      <div>
        <label className="label">
          Photos{' '}
          <span className="font-normal text-stone-400">(optional, up to {MAX_PHOTOS})</span>
        </label>

        {photoPreviews.length > 0 && (
          <div className="mb-3 grid grid-cols-4 gap-2">
            {photoPreviews.map((src, i) => (
              <div key={src} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  className="h-full w-full rounded-xl object-cover border border-stone-200"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-stone-800 text-white text-xs hover:bg-red-600 transition-colors"
                  aria-label="Remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {photos.length < MAX_PHOTOS && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 py-6 text-sm text-stone-400 transition-colors hover:border-brand-300 hover:text-brand-500"
            >
              <span className="text-xl">📷</span>
              {photos.length === 0 ? 'Add photos' : `Add more (${photos.length}/${MAX_PHOTOS})`}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </>
        )}
      </div>

      {/* Region (read-only) */}
      <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-stone-500">Your region</span>
        <span className="text-sm font-medium text-stone-800">{region}</span>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={uploading}
        className="btn-primary w-full py-4 text-base"
      >
        {uploading ? uploadStatus || 'Publishing…' : 'Publish listing →'}
      </button>
    </form>
  )
}
