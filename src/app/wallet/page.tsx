'use client'

import Link from 'next/link'
import { LanguageToggle } from '@/lib/i18n/translations'

export default function WalletPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white border-b border-gray-100 px-4 py-4 flex justify-between items-center sticky top-0">
                <div className="flex items-center space-x-4">
                    <Link href="/profile" className="text-gray-500 hover:text-black transition">
                        <i className="fa-solid fa-arrow-left text-lg"></i>
                    </Link>
                    <span className="font-black text-lg">Wallet</span>
                </div>
                <LanguageToggle />
            </header>

            <div className="max-w-md mx-auto p-4 space-y-4">
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Balance</h3>
                    <div className="flex justify-between items-end">
                        <span className="text-4xl font-bold">¥0</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fa-brands fa-stripe text-3xl text-indigo-500"></i>
                    </div>
                    <h2 className="font-bold text-lg mb-2">Connect Payout Method</h2>
                    <p className="text-gray-500 text-sm mb-6">Connect your bank account via Stripe to receive payouts from your sessions.</p>
                    <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-3 rounded-xl cursor-not-allowed">
                        Setup Stripe Connect (Coming Soon)
                    </button>
                </div>
            </div>
        </div>
    )
}
