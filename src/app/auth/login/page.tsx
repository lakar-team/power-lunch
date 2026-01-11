'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirect') || '/search'
    const { t } = useTranslation()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        router.push(redirectTo)
        router.refresh()
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-8">
            <h1 className="text-2xl font-black text-center mb-2">{t('auth.login.title')}</h1>
            <p className="text-gray-500 text-center mb-8">{t('auth.login.subtitle')}</p>

            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                        {t('auth.login.email')}
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-input"
                        placeholder="you@example.com"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">
                        {t('auth.login.password')}
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-input"
                        placeholder="••••••••"
                        required
                        minLength={8}
                    />
                </div>

                <div className="flex justify-end">
                    <Link href="/auth/reset" className="text-sm text-green-600 hover:underline">
                        {t('auth.login.forgot')}
                    </Link>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full pl-btn pl-btn-primary"
                >
                    {loading ? t('auth.login.loading') : t('auth.login.btn')}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-gray-500">
                    {t('auth.login.noAccount')}{' '}
                    <Link href={`/auth/signup${redirectTo !== '/search' ? `?redirect=${redirectTo}` : ''}`} className="text-green-600 font-bold hover:underline">
                        {t('auth.login.signupLink')}
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 py-4 flex justify-between items-center">
                <Link href="/" className="pl-logo text-xl">
                    POWER<span>LUNCH</span>.
                </Link>
                <LanguageToggle />
            </header>

            {/* Login Form */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
                        <LoginForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
