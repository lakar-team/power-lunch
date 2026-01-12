'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { LanguageToggle } from '@/lib/i18n/translations'

export default function WalletPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isHost, setIsHost] = useState(false)

    useEffect(() => {
        async function checkUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login?redirect=/wallet')
                return
            }
            setUser(user)

            // Check if user is a host
            const { data: host } = await supabase
                .from('hosts')
                .select('id, stripe_account_id')
                .eq('user_id', user.id)
                .single()

            setIsHost(!!host)
            setLoading(false)
        }
        checkUser()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white border-b border-gray-100 px-4 py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center space-x-4">
                    <Link href="/profile" className="text-gray-500 hover:text-black transition">
                        <i className="fa-solid fa-arrow-left text-lg"></i>
                    </Link>
                    <span className="font-black text-lg">Wallet</span>
                </div>
                <LanguageToggle />
            </header>

            <div className="max-w-md mx-auto p-4 space-y-4">
                {/* Balance Card */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Balance</h3>
                    <div className="flex justify-between items-end">
                        <span className="text-4xl font-bold">¥0</span>
                        <span className="text-xs text-gray-400">Available for payout</span>
                    </div>
                </div>

                {/* Host Earnings Summary */}
                {isHost && (
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Host Earnings</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-green-600">¥0</p>
                                <p className="text-xs text-gray-400">This Month</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-black">0</p>
                                <p className="text-xs text-gray-400">Sessions</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-black">¥0</p>
                                <p className="text-xs text-gray-400">All Time</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Setup */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fa-brands fa-stripe text-3xl text-indigo-600"></i>
                        </div>
                        <h2 className="font-bold text-lg mb-2">Payout Method</h2>
                        <p className="text-gray-500 text-sm mb-6">
                            {isHost
                                ? 'Complete Stripe setup to receive payouts from your sessions.'
                                : 'Become a host to start earning money on Power Lunch.'
                            }
                        </p>

                        {isHost ? (
                            <Link
                                href="/host/onboard"
                                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl inline-block hover:bg-indigo-700 transition shadow-lg"
                            >
                                <i className="fa-solid fa-link mr-2"></i>
                                Connect Stripe Account
                            </Link>
                        ) : (
                            <Link
                                href="/host/onboard"
                                className="w-full bg-black text-white font-bold py-3 rounded-xl inline-block hover:bg-gray-800 transition shadow-lg"
                            >
                                <i className="fa-solid fa-plus mr-2"></i>
                                Become a Host
                            </Link>
                        )}
                    </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Transaction History</h3>
                        <span className="text-xs text-gray-400">Last 30 days</span>
                    </div>

                    <div className="text-center py-8 text-gray-400">
                        <i className="fa-solid fa-receipt text-4xl mb-3 opacity-30"></i>
                        <p className="text-sm">No transactions yet</p>
                        <p className="text-xs mt-1">Your earnings and payments will appear here</p>
                    </div>
                </div>

                {/* Help Section */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <div className="flex items-start">
                        <i className="fa-solid fa-circle-info text-blue-500 mt-1 mr-3"></i>
                        <div>
                            <p className="text-sm font-medium text-blue-700">How payouts work</p>
                            <p className="text-xs text-blue-600 mt-1">
                                After each completed session, your earnings (minus the 15% platform fee) are automatically deposited to your connected bank account within 2-7 business days.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

