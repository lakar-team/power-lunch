'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'

import { useAuth } from '@/components/AuthProvider'

export default function SettingsPage() {
    const router = useRouter()
    const { t, language, setLanguage } = useTranslation()
    const { user, loading, signOut } = useAuth()
    // const [user, setUser] = useState<any>(null)
    // const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Settings state
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [pushNotifications, setPushNotifications] = useState(true)
    const [marketingEmails, setMarketingEmails] = useState(false)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login?redirect=/settings')
        }
    }, [user, loading, router])

    const handleLogout = async () => {
        await signOut()
        router.push('/')
    }

    const handleDeleteAccount = async () => {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            // In production, this would call an API to delete the account
            alert('Account deletion request submitted. You will receive a confirmation email.')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-10">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <button onClick={() => router.back()} className="text-gray-600 hover:text-black">
                        <i className="fa-solid fa-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-lg font-bold">Settings</h1>
                    <div className="w-8"></div>
                </div>
            </header>

            <div className="max-w-lg mx-auto p-6 space-y-6">
                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* Language Section */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Language / 言語</h2>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <i className="fa-solid fa-globe text-blue-500 mr-3"></i>
                            <span className="font-medium">Display Language</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setLanguage('en')}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition ${language === 'en' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => setLanguage('ja')}
                                className={`px-4 py-2 rounded-full text-sm font-bold transition ${language === 'ja' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                日本語
                            </button>
                        </div>
                    </div>
                </section>

                {/* Notifications Section */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Notifications</h2>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <i className="fa-solid fa-envelope text-purple-500 mr-3"></i>
                                <div>
                                    <p className="font-medium">Email Notifications</p>
                                    <p className="text-xs text-gray-400">Booking confirmations & reminders</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={emailNotifications}
                                    onChange={(e) => setEmailNotifications(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-black peer-focus:ring-2 peer-focus:ring-gray-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <i className="fa-solid fa-bell text-orange-500 mr-3"></i>
                                <div>
                                    <p className="font-medium">Push Notifications</p>
                                    <p className="text-xs text-gray-400">Real-time updates on your phone</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={pushNotifications}
                                    onChange={(e) => setPushNotifications(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-black peer-focus:ring-2 peer-focus:ring-gray-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <i className="fa-solid fa-bullhorn text-green-500 mr-3"></i>
                                <div>
                                    <p className="font-medium">Marketing Emails</p>
                                    <p className="text-xs text-gray-400">New features & promotions</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={marketingEmails}
                                    onChange={(e) => setMarketingEmails(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-black peer-focus:ring-2 peer-focus:ring-gray-300 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Account Section */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Account</h2>

                    <div className="space-y-3">
                        <Link href="/profile/edit" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
                            <div className="flex items-center">
                                <i className="fa-solid fa-user-pen text-blue-500 mr-3"></i>
                                <span className="font-medium">Edit Profile</span>
                            </div>
                            <i className="fa-solid fa-chevron-right text-gray-300"></i>
                        </Link>

                        <Link href="/terms" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
                            <div className="flex items-center">
                                <i className="fa-solid fa-file-contract text-gray-500 mr-3"></i>
                                <span className="font-medium">Terms of Service</span>
                            </div>
                            <i className="fa-solid fa-chevron-right text-gray-300"></i>
                        </Link>

                        <Link href="/privacy" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
                            <div className="flex items-center">
                                <i className="fa-solid fa-shield-halved text-gray-500 mr-3"></i>
                                <span className="font-medium">Privacy Policy</span>
                            </div>
                            <i className="fa-solid fa-chevron-right text-gray-300"></i>
                        </Link>

                        <a href="mailto:lakar.team@gmail.com" className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition">
                            <div className="flex items-center">
                                <i className="fa-solid fa-headset text-gray-500 mr-3"></i>
                                <span className="font-medium">Contact Support</span>
                            </div>
                            <i className="fa-solid fa-chevron-right text-gray-300"></i>
                        </a>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-4">Danger Zone</h2>

                    <div className="space-y-3">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition text-left"
                        >
                            <div className="flex items-center">
                                <i className="fa-solid fa-right-from-bracket text-orange-500 mr-3"></i>
                                <span className="font-medium">Log Out</span>
                            </div>
                        </button>

                        <button
                            onClick={handleDeleteAccount}
                            className="w-full flex items-center justify-between p-3 hover:bg-red-50 rounded-xl transition text-left"
                        >
                            <div className="flex items-center">
                                <i className="fa-solid fa-trash text-red-500 mr-3"></i>
                                <span className="font-medium text-red-600">Delete Account</span>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Version */}
                <div className="text-center text-xs text-gray-400 pt-4">
                    Power Lunch v1.0.0
                </div>
            </div>
        </div>
    )
}
