'use client'

import Link from 'next/link'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'

export default function HomePage() {
    const { t } = useTranslation()

    const categories = [
        { key: 'home.category.english' as const, icon: 'fa-language', color: 'bg-red-100 text-red-600' },
        { key: 'home.category.programming' as const, icon: 'fa-code', color: 'bg-blue-100 text-blue-600' },
        { key: 'home.category.design' as const, icon: 'fa-palette', color: 'bg-purple-100 text-purple-600' },
        { key: 'home.category.business' as const, icon: 'fa-briefcase', color: 'bg-green-100 text-green-600' },
        { key: 'home.category.cooking' as const, icon: 'fa-utensils', color: 'bg-orange-100 text-orange-600' },
        { key: 'home.category.music' as const, icon: 'fa-music', color: 'bg-pink-100 text-pink-600' },
        { key: 'home.category.photography' as const, icon: 'fa-camera', color: 'bg-yellow-100 text-yellow-600' },
        { key: 'home.category.other' as const, icon: 'fa-ellipsis', color: 'bg-gray-100 text-gray-600' },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="pl-logo text-xl">
                        POWER<span>LUNCH</span>.
                    </Link>
                    <div className="flex items-center space-x-4">
                        <LanguageToggle />
                        <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                            {t('nav.login')}
                        </Link>
                        <Link href="/auth/signup" className="pl-btn pl-btn-primary text-sm">
                            {t('nav.signup')}
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-6xl mx-auto px-4 py-20 text-center">
                <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                    {t('home.hero.title')}<span className="text-green-500">{t('home.hero.titleHighlight')}</span>に。
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    {t('home.hero.subtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/search" className="pl-btn pl-btn-primary text-lg px-10">
                        <i className="fa-solid fa-search mr-2"></i>
                        {t('home.hero.searchBtn')}
                    </Link>
                    <Link href="/host/onboard" className="pl-btn pl-btn-secondary text-lg px-10">
                        {t('home.hero.hostBtn')}
                    </Link>
                </div>
            </section>

            {/* How It Works */}
            <section className="bg-white py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-black text-center mb-12">{t('home.howItWorks')}</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fa-solid fa-search text-2xl text-green-600"></i>
                            </div>
                            <h3 className="font-bold text-lg mb-2">{t('home.step1.title')}</h3>
                            <p className="text-gray-600">{t('home.step1.desc')}</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fa-solid fa-calendar-check text-2xl text-blue-600"></i>
                            </div>
                            <h3 className="font-bold text-lg mb-2">{t('home.step2.title')}</h3>
                            <p className="text-gray-600">{t('home.step2.desc')}</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fa-solid fa-utensils text-2xl text-purple-600"></i>
                            </div>
                            <h3 className="font-bold text-lg mb-2">{t('home.step3.title')}</h3>
                            <p className="text-gray-600">{t('home.step3.desc')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-black text-center mb-12">{t('home.categories')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {categories.map((cat) => (
                            <Link
                                key={cat.key}
                                href={`/search?category=${t(cat.key)}`}
                                className="pl-card p-6 flex flex-col items-center hover:shadow-lg"
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${cat.color}`}>
                                    <i className={`fa-solid ${cat.icon} text-xl`}></i>
                                </div>
                                <span className="font-bold">{t(cat.key)}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-black text-white py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-black mb-6">{t('home.cta.title')}</h2>
                    <p className="text-gray-400 mb-8">
                        {t('home.cta.subtitle')}
                    </p>
                    <Link href="/host/onboard" className="pl-btn pl-btn-success text-lg px-10">
                        {t('home.cta.btn')}
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 py-12">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="pl-logo text-xl mb-4 md:mb-0">
                            POWER<span>LUNCH</span>.
                        </div>
                        <div className="flex space-x-6 text-sm text-gray-500">
                            <Link href="/about">{t('footer.about')}</Link>
                            <Link href="/privacy">{t('footer.privacy')}</Link>
                            <Link href="/terms">{t('footer.terms')}</Link>
                            <Link href="/contact">{t('footer.contact')}</Link>
                        </div>
                    </div>
                    <p className="text-center text-gray-400 text-sm mt-8">
                        © 2026 Power Lunch. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
