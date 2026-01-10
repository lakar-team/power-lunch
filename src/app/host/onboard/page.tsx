'use client'

import Link from 'next/link'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'

export default function HostOnboardPage() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-100 px-4 py-4 flex justify-between items-center">
                <Link href="/" className="pl-logo text-xl">
                    POWER<span>LUNCH</span>.
                </Link>
                <LanguageToggle />
            </header>
            <main className="flex-1 max-w-6xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-4">{t('host.onboard.title')}</h1>
                <p className="text-gray-600 mb-4">{t('host.onboard.subtitle')}</p>
                <p className="text-gray-500">{t('common.underConstruction')}</p>
            </main>
        </div>
    )
}
