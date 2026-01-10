'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function SignupPage() {
    const router = useRouter()
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
                <header className="bg-white border-b border-gray-100 px-4 py-4">
                    <Link href="/" className="pl-logo text-xl">
                        POWER<span>LUNCH</span>.
                    </Link>
                </header>
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fa-solid fa-envelope text-3xl text-green-600"></i>
                        </div>
                        <h1 className="text-2xl font-black mb-2">確認メールを送信しました</h1>
                        <p className="text-gray-500 mb-6">
                            {email} に確認メールを送信しました。<br />
                            メール内のリンクをクリックして登録を完了してください。
                        </p>
                        <Link href="/auth/login" className="pl-btn pl-btn-secondary">
                            ログインページへ
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 py-4">
                <Link href="/" className="pl-logo text-xl">
                    POWER<span>LUNCH</span>.
                </Link>
            </header>

            {/* Signup Form */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-lg p-8">
                        <h1 className="text-2xl font-black text-center mb-2">アカウント作成</h1>
                        <p className="text-gray-500 text-center mb-8">Power Lunchを始めよう</p>

                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSignup} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">
                                    お名前
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="pl-input"
                                    placeholder="田中 太郎"
                                    required
                                />
                            </div>

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
                                    placeholder="8文字以上"
                                    required
                                    minLength={8}
                                />
                                <p className="text-xs text-gray-400 mt-1">8文字以上で設定してください</p>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full pl-btn pl-btn-primary"
                                >
                                    {loading ? '登録中...' : '登録する'}
                                </button>
                            </div>
                        </form>

                        <p className="text-xs text-gray-400 text-center mt-6">
                            登録することで、<Link href="/terms" className="underline">利用規約</Link>と
                            <Link href="/privacy" className="underline">プライバシーポリシー</Link>に同意したことになります。
                        </p>

                        <div className="mt-8 text-center">
                            <p className="text-gray-500">
                                すでにアカウントをお持ちですか？{' '}
                                <Link href="/auth/login" className="text-green-600 font-bold hover:underline">
                                    ログイン
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
