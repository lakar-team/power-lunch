'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function LoginPage() {
    const router = useRouter()
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

        router.push('/search')
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 py-4">
                <Link href="/" className="pl-logo text-xl">
                    POWER<span>LUNCH</span>.
                </Link>
            </header>

            {/* Login Form */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h1 className="text-2xl font-black text-center mb-2">おかえりなさい</h1>
                        <p className="text-gray-500 text-center mb-8">アカウントにログイン</p>

                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    メールアドレス
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
                                    パスワード
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
                                    パスワードをお忘れですか？
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full pl-btn pl-btn-primary"
                            >
                                {loading ? 'ログイン中...' : 'ログイン'}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-500">
                                アカウントをお持ちでないですか？{' '}
                                <Link href="/auth/signup" className="text-green-600 font-bold hover:underline">
                                    新規登録
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
