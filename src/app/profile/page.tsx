'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'

export default function ProfilePage() {
    const router = useRouter()
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState<'guest' | 'host'>('guest')
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login?redirect=/profile')
                return
            }
            setUser(user)
            setLoading(false)
        }
        getUser()
    }, [router, supabase])

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header / Profile Summary */}
            <header className="bg-white px-6 pt-4 pb-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <Link href="/" className="pl-logo">POWER<span>LUNCH</span>.</Link>
                    <div className="flex items-center space-x-3">
                        <LanguageToggle />
                        <button onClick={() => alert('Settings coming soon!')} className="text-gray-400 hover:text-black">
                            <i className="fa-solid fa-gear text-xl"></i>
                        </button>
                    </div>
                </div>

                <div className="flex items-center">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold border-4 border-white shadow-md">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="ml-4">
                        <h2 className="text-lg font-bold">{user.user_metadata?.full_name || 'User'}</h2>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <div className="flex items-center mt-1 text-xs text-yellow-500 font-bold">
                            <i className="fa-solid fa-star mr-1"></i> 5.0 <span className="text-gray-300 mx-1">•</span> <span className="text-gray-400 font-normal">New Member</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white px-6 border-b border-gray-200 sticky top-0 z-20">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('guest')}
                        className={`py-3 text-sm font-bold transition-colors ${activeTab === 'guest' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {t('nav.myPlans')}
                    </button>
                    <button
                        onClick={() => setActiveTab('host')}
                        className={`py-3 text-sm font-bold transition-colors ${activeTab === 'host' ? 'border-b-2 border-black text-black' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Hosting
                    </button>
                    <button
                        onClick={() => router.push('/wallet')}
                        className="py-3 text-sm font-bold text-gray-400 hover:text-gray-600"
                    >
                        Wallet
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-md mx-auto p-4 min-h-[60vh]">

                {/* GUEST VIEW */}
                {activeTab === 'guest' && (
                    <div className="space-y-4 animate-fade-in-up">
                        <div className="text-center py-10 opacity-75">
                            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fa-regular fa-calendar-plus text-3xl text-gray-300"></i>
                            </div>
                            <p className="text-sm font-bold text-gray-500">No upcoming plans</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">Find a host nearby to learn something new.</p>
                            <Link href="/search" className="mt-4 bg-black text-white text-xs font-bold px-6 py-3 rounded-full inline-block shadow-lg hover:bg-gray-800 transition">
                                Find a Session
                            </Link>
                        </div>

                        <div className="py-4 mt-2">
                            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Sample History</span>
                        </div>
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 opacity-60">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 mr-3 font-bold text-xs"><i className="fa-solid fa-check"></i></div>
                                    <div>
                                        <h3 className="font-bold text-sm text-gray-600">Welcome to Power Lunch</h3>
                                        <p className="text-[10px] text-gray-400">Account Created</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* HOST VIEW */}
                {activeTab === 'host' && (
                    <div className="space-y-4 animate-fade-in-up">
                        {/* Earnings Card */}
                        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-5 text-white shadow-lg">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Balance</h3>
                            <div className="flex justify-between items-end">
                                <span className="text-3xl font-bold">¥0</span>
                                <button className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-[10px] font-bold transition">
                                    Cash Out
                                </button>
                            </div>
                            <div className="mt-4 pt-3 border-t border-white/10 flex text-[10px] text-gray-400">
                                <span className="mr-3"><i className="fa-solid fa-arrow-up mr-1 text-green-400"></i> ¥0 this week</span>
                            </div>
                        </div>

                        {/* Active Listings */}
                        <div className="flex justify-between items-end px-1 mt-6">
                            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">My Listings</h2>
                            <Link href="/host/listings/new" className="text-blue-600 text-xs font-bold hover:underline">
                                + Create New
                            </Link>
                        </div>

                        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                            <p className="text-sm text-gray-400 font-bold">No active listings</p>
                            <Link href="/host/onboard" className="mt-2 inline-block text-xs text-black underline font-bold">
                                Become a Host
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
