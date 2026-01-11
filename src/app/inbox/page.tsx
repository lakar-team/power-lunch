'use client'

import Link from 'next/link'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'

export default function InboxPage() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white border-b border-gray-100 px-4 py-4 flex justify-between items-center sticky top-0">
                <Link href="/" className="pl-logo text-xl">
                    POWER<span>LUNCH</span>.
                </Link>
                <LanguageToggle />
            </header>

            <div className="max-w-md mx-auto p-4 min-h-[60vh] flex flex-col items-center justify-center text-center opacity-60">
                <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mb-6">
                    <i className="fa-regular fa-comment-dots text-4xl text-gray-300"></i>
                </div>
                <h2 className="text-xl font-black text-gray-400 mb-2">{t('nav.inbox')}</h2>
                <p className="text-gray-400 text-sm">No new messages.</p>
                <div className="mt-8">
                    <Link href="/search" className="pl-btn pl-btn-primary">
                        Find a Host
                    </Link>
                </div>
            </div>
        </div>
    )
}
