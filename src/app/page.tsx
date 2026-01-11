'use client'

import Link from 'next/link'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { useEffect } from 'react'

export default function HomePage() {
    const { t } = useTranslation()

    // Scroll animation effect
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up')
                    entry.target.classList.remove('opacity-0')
                    observer.unobserve(entry.target)
                }
            })
        }, observerOptions)

        document.querySelectorAll('.scroll-animate').forEach(el => {
            el.classList.add('opacity-0')
            observer.observe(el)
        })

        return () => observer.disconnect()
    }, [])

    const popularTopics = [
        { name: 'English', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
        { name: 'Coding', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
        { name: 'Design', image: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
        { name: 'Career', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80' },
    ]

    return (
        <div className="min-h-screen bg-white text-gray-800 antialiased pb-0">
            {/* Hero Section - Full Bleed */}
            <header className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 overflow-hidden pt-24">
                {/* Background Image */}
                <img
                    src="https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-1.2.1&auto=format&fit=crop&w=1400&q=80"
                    alt="People connecting"
                    className="absolute inset-0 w-full h-full object-cover z-0"
                />
                {/* Gradient Overlay */}
                <div className="hero-gradient absolute inset-0 z-10"></div>

                {/* Navigation */}
                <nav className="absolute top-0 left-0 w-full z-50 flex justify-between items-center p-6 text-white">
                    <div className="text-2xl font-black tracking-tighter">
                        POWER<span className="text-blue-400">LUNCH</span>.
                    </div>
                    <div className="flex items-center space-x-3">
                        <LanguageToggle />
                        <Link
                            href="/auth/login"
                            className="text-sm font-bold border border-white/30 px-4 py-2 rounded-full hover:bg-white hover:text-black transition"
                        >
                            {t('nav.login')}
                        </Link>
                    </div>
                </nav>

                {/* Hero Content */}
                <div className="relative z-20 max-w-lg animate-fade-in-up px-4 mt-8">
                    <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-8">
                        <span>{t('home.hero.title')}</span><br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                            {t('home.hero.titleHighlight')}
                        </span>
                    </h1>
                    <p className="text-base text-gray-200 mb-10 font-light leading-relaxed">
                        {t('home.hero.subtitle')}
                    </p>

                    {/* Dual CTAs */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
                        <Link
                            href="/search"
                            className="inline-flex items-center justify-center bg-white text-black text-lg font-bold py-4 px-8 rounded-full shadow-2xl hover:bg-gray-100 hover:scale-105 transition transform"
                        >
                            <i className="fa-solid fa-magnifying-glass mr-2"></i>
                            {t('home.hero.searchBtn')}
                        </Link>
                        <Link
                            href="/auth/login?redirect=/host/onboard"
                            className="inline-flex items-center justify-center border-2 border-white text-white text-lg font-bold py-4 px-8 rounded-full hover:bg-white hover:text-black transition transform"
                        >
                            <i className="fa-solid fa-plus mr-2"></i>
                            {t('home.hero.hostBtn')}
                        </Link>
                    </div>

                    <p className="mt-6 text-sm text-gray-300">No subscription. Pay per session.</p>

                    {/* Social Proof */}
                    <div className="mt-8 flex items-center justify-center space-x-3">
                        <div className="pl-avatar-stack">
                            <img src="https://ui-avatars.com/api/?name=Yuki+S&background=random" alt="User" />
                            <img src="https://ui-avatars.com/api/?name=Ken+M&background=random" alt="User" />
                            <img src="https://ui-avatars.com/api/?name=Lisa+T&background=random" alt="User" />
                        </div>
                        <span className="text-white/80 text-sm">Join 1,200+ users worldwide</span>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
                    <i className="fa-solid fa-chevron-down text-white/50 text-xl"></i>
                </div>
            </header>

            {/* How It Works */}
            <section className="py-16 px-6 max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-2 scroll-animate">
                        {t('home.howItWorks')}
                    </h2>
                    <h3 className="text-3xl font-bold text-gray-900 scroll-animate delay-100">
                        Make Every Moment Count
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center scroll-animate delay-100">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-2xl mx-auto mb-6">
                            <i className="fa-solid fa-map-location-dot"></i>
                        </div>
                        <h4 className="text-xl font-bold mb-3">{t('home.step1.title')}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">{t('home.step1.desc')}</p>
                    </div>

                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center scroll-animate delay-200">
                        <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 text-2xl mx-auto mb-6">
                            <i className="fa-solid fa-ticket"></i>
                        </div>
                        <h4 className="text-xl font-bold mb-3">{t('home.step2.title')}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">{t('home.step2.desc')}</p>
                    </div>

                    <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 text-center scroll-animate delay-300">
                        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 text-2xl mx-auto mb-6">
                            <i className="fa-solid fa-utensils"></i>
                        </div>
                        <h4 className="text-xl font-bold mb-3">{t('home.step3.title')}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">{t('home.step3.desc')}</p>
                    </div>
                </div>
            </section>

            {/* Popular Topics - Dark Section */}
            <section className="py-10 px-6 bg-black text-white">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-end mb-8">
                        <h3 className="text-2xl font-bold">{t('home.categories')}</h3>
                        <Link href="/search" className="text-sm text-gray-400 hover:text-white">
                            View all <i className="fa-solid fa-arrow-right ml-1"></i>
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {popularTopics.map((topic) => (
                            <Link
                                key={topic.name}
                                href={`/search?category=${topic.name}`}
                                className="group relative h-32 rounded-xl overflow-hidden bg-gray-800"
                            >
                                <img
                                    src={topic.image}
                                    alt={topic.name}
                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition"
                                />
                                <span className="absolute bottom-3 left-3 font-bold text-lg">{topic.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-20">
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
            <footer className="bg-gray-100 py-12 text-center text-gray-500 text-sm">
                <p className="mb-4">Designed in Sendai 🇯🇵</p>
                <div className="flex justify-center space-x-6 mb-8">
                    <i className="fa-brands fa-stripe text-2xl text-gray-400"></i>
                    <i className="fa-brands fa-apple text-2xl text-gray-400"></i>
                    <i className="fa-brands fa-google text-2xl text-gray-400"></i>
                </div>
                <p>© 2026 Power Lunch. All rights reserved.</p>
            </footer>
        </div>
    )
}

