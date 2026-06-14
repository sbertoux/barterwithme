'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  initialUsername: string
  initialRegion: string
  initialBio: string
}

export function ProfileSetupForm({ userId, initialUsername, initialRegion, initialBio }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [username, setUsername] = useState(initialUsername)
  const [bio, setBio] = useState(initialBio)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      username: username.trim(),
      bio: bio.trim(),
      region: initialRegion,
      updated_at: new Date().toISOString(),
    })

    setLoading(false)
    if (error) {
      if (error.code === '23505') {
        setError('That username is already taken.')
      } else {
        setError(error.message)
      }
      return
    }

    router.push('/listings/new?onboarding=1')
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div>
        <label className="label" htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          className="input"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_-]+"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError('') }}
        />
      </div>

      <div>
        <label className="label" htmlFor="bio">About you <span className="text-stone-400 font-normal">(optional)</span></label>
        <textarea
          id="bio"
          className="input resize-none"
          rows={3}
          maxLength={280}
          placeholder="What do you offer? What are you usually looking for? What's your corner of the world like?"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <p className="mt-1 text-xs text-stone-400">{bio.length}/280</p>
      </div>

      {initialRegion && (
        <div className="rounded-xl bg-stone-50 border border-stone-200 px-4 py-3 text-sm">
          <span className="text-stone-500">Your region: </span>
          <span className="font-medium text-stone-800">{initialRegion}</span>
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Saving…' : 'Continue — add your first listing →'}
      </button>

      <p className="text-center text-xs text-stone-400">
        You need at least one active listing to participate in trades.
      </p>
    </form>
  )
}
