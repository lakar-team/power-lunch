'use client'

import Link from 'next/link'

export default function HostOnboardPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-100 px-4 py-4">
                <Link href="/" className="pl-logo text-xl">
                    POWER<span>LUNCH</span>.
                </Link>
            </header>
            <main className="flex-1 max-w-6xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-4">ホストになる</h1>
                <p>ホスト登録機能は現在開発中です。</p>
            </main>
        </div>
    )
}
