import { Metadata } from 'next'
import { LoginForm } from './LoginForm'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Log in' }

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12 pb-24 sm:pb-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-stone-900">Welcome back</h1>
      </div>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-stone-500">
        No account yet?{' '}
        <a href="/signup" className="font-medium text-brand-600 hover:underline">
          Join BarterWithMe
        </a>
      </p>
    </div>
  )
}
