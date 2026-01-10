'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'

export default function SignupPage() {
    const router = useRouter()
    const { t, language } = useTranslation()
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: fullName,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback?next=/search`,
            },
        })

        if (error) {
            setError(error.message)
            setLoading(false)
            return
        }

        setSuccess(true)
        setLoading(false)
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <header className="bg-white border-b border-gray-100 px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="pl-logo text-xl">
                        POWER<span>LUNCH</span>.
                    </Link>
                    <LanguageToggle />
                </header>
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fa-solid fa-envelope text-3xl text-green-600"></i>
                        </div>
                        <h1 className="text-2xl font-black mb-2">
                            {language === 'en' ? 'Check Your Email' : '確認メールを送信しました'}
                        </h1>
                        <p className="text-gray-500 mb-6">
                            {language === 'en'
                                ? `We sent a confirmation email to ${email}. Click the link in the email to complete your registration.`
                                : `${email} に確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。`
                            }
                        </p>
                        <Link href="/auth/login" className="pl-btn pl-btn-secondary">
                            {language === 'en' ? 'Go to Login' : 'ログインページへ'}
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 py-4 flex justify-between items-center">
                <Link href="/" className="pl-logo text-xl">
                    POWER<span>LUNCH</span>.
                </Link>
                <LanguageToggle />
            </header>

            {/* Signup Form */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h1 className="text-2xl font-black text-center mb-2">{t('auth.signup.title')}</h1>
                        <p className="text-gray-500 text-center mb-8">{t('auth.signup.subtitle')}</p>

                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSignup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    {t('auth.signup.name')}
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="pl-input"
                                    placeholder={language === 'en' ? 'John Doe' : '田中 太郎'}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    {t('auth.signup.email')}
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
                                    {t('auth.signup.password')}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-input"
                                    placeholder={language === 'en' ? '8+ characters' : '8文字以上'}
                                    required
                                    minLength={8}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    {language === 'en' ? 'Minimum 8 characters' : '8文字以上で設定してください'}
                                </p>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full pl-btn pl-btn-primary"
                                >
                                    {loading ? t('auth.signup.loading') : t('auth.signup.btn')}
                                </button>
                            </div>
                        </form>

                        <p className="text-xs text-gray-400 text-center mt-6">
                            {language === 'en'
                                ? <>By signing up, you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</>
                                : <>登録することで、<Link href="/terms" className="underline">利用規約</Link>と<Link href="/privacy" className="underline">プライバシーポリシー</Link>に同意したことになります。</>
                            }
                        </p>

                        <div className="mt-8 text-center">
                            <p className="text-gray-500">
                                {t('auth.signup.hasAccount')}{' '}
                                <Link href="/auth/login" className="text-green-600 font-bold hover:underline">
                                    {t('auth.signup.loginLink')}
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
