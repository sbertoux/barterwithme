'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { zipToRegion, isValidUSZip } from '@/lib/region'

interface Props {
  userId: string
  initial: {
    username: string
    bio: string
    region: string
  }
}

export function EditProfileForm({ userId, initial }: Props) {
  const supabase = createClient()

  const [username, setUsername] = useState(initial.username)
  const [bio, setBio] = useState(initial.bio)
  const [zip, setZip] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const derivedRegion = zip && isValidUSZip(zip) ? zipToRegion(zip.trim()) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmedUsername = username.trim()
    if (!trimmedUsername) { setError('Username is required.'); return }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      setError('Username may only contain letters, numbers, _ and -.')
      return
    }

    if (zip && !isValidUSZip(zip)) {
      setError('Please enter a valid US zip code, or leave it blank to keep your current region.')
      return
    }

    setSaving(true)

    const updates: Record<string, string> = {
      username: trimmedUsername,
      bio: bio.trim(),
    }
    if (zip && derivedRegion) {
      updates.region = derivedRegion
    }

    const { error: dbError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    setSaving(false)

    if (dbError) {
      if (dbError.code === '23505') {
        setError('That username is already taken.')
      } else {
        setError(dbError.message)
      }
      return
    }

    window.location.href = '/profile'
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      {error && (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label className="label" htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          className="input"
          required
          minLength={3}
          maxLength={30}
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError('') }}
        />
        <p className="mt-1 text-xs text-stone-400">Letters, numbers, _ and - only</p>
      </div>

      <div>
        <label className="label" htmlFor="bio">
          About you <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <textarea
          id="bio"
          className="input resize-none"
          rows={3}
          maxLength={300}
          placeholder="A sentence or two about yourself or what you like to trade…"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <p className="mt-1 text-right text-xs text-stone-400">{bio.length}/300</p>
      </div>

      <div>
        <label className="label" htmlFor="zip">
          Update region via zip code <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <input
          id="zip"
          type="text"
          inputMode="numeric"
          className="input"
          maxLength={10}
          placeholder="Leave blank to keep current region"
          value={zip}
          onChange={(e) => { setZip(e.target.value); setError('') }}
        />
        {derivedRegion ? (
          <p className="mt-1 text-xs font-medium text-brand-600">New region: {derivedRegion}</p>
        ) : (
          <p className="mt-1 text-xs text-stone-400">
            Current region: {initial.region} — your zip is never stored or shown.
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-1">
        <button type="submit" disabled={saving} className="btn-primary flex-1 py-3">
          {saving ? 'Saving…' : 'Save changes →'}
        </button>
        <a href="/profile" className="btn-secondary px-5 py-3 text-center text-sm">
          Cancel
        </a>
      </div>
    </form>
  )
}
