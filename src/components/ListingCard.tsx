import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'

const TYPE_CONFIG = {
  item:      { label: 'Item',      classes: 'bg-stone-100 text-stone-600' },
  service:   { label: 'Service',   classes: 'bg-sky-50 text-sky-700' },
  recurring: { label: 'Recurring', classes: 'bg-green-50 text-green-700' },
} as const

const CATEGORY_ICONS: Record<string, string> = {
  'food-garden': '🌱',
  'skills-labor': '🔨',
  'household-tools': '🏠',
  'animals-livestock': '🐄',
  'professional-services': '💼',
  'handmade-crafts': '🧶',
  'transportation': '🚛',
  'valuables-collectibles': '✨',
  'other': '📦',
}

interface Props {
  id: string
  title: string
  description: string
  listingType: 'item' | 'service' | 'recurring'
  category: { name: string; slug: string } | null
  photos: string[]
  openTo: string | null
  region: string
  username: string
}

export function ListingCard({
  id, title, description, listingType, category, photos, openTo, region, username,
}: Props) {
  const type = TYPE_CONFIG[listingType] ?? TYPE_CONFIG.item
  const icon = category ? (CATEGORY_ICONS[category.slug] ?? '📦') : '📦'
  const photo = photos[0]

  return (
    <Link
      href={`/listings/${id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
    >
      {/* Photo / placeholder */}
      <div className="relative aspect-[4/3] bg-stone-100">
        {photo ? (
          <Image
            src={photo}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl opacity-20">
            {icon}
          </div>
        )}
        <span
          className={cn(
            'absolute right-2 top-2 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm',
            type.classes
          )}
        >
          {type.label}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        {category && (
          <p className="mb-1 text-xs text-stone-400">
            {icon} {category.name}
          </p>
        )}

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900 group-hover:text-brand-700">
          {title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs text-stone-500">{description}</p>

        {openTo && (
          <p className="mt-2 line-clamp-1 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs text-brand-700">
            Open to: {openTo}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 text-xs text-stone-400">
          <span>@{username}</span>
          <span>{region}</span>
        </div>
      </div>
    </Link>
  )
}
