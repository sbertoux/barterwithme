import { Metadata } from 'next'
import { SignupForm } from './SignupForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Join BarterWithMe' }

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 pb-24 sm:pb-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-stone-900">Join the community</h1>
        <p className="mt-2 text-sm text-stone-500">
          Verification required — your region is shown, never your address.
        </p>
      </div>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{' '}
        <a href="/login" className="font-medium text-brand-600 hover:underline">
          Log in
        </a>
      </p>
    </div>
  )
}
