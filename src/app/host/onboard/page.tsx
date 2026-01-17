'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { supabase } from '@/lib/supabase/client'
import { categories, getCategoryById, Subcategory } from '@/lib/categories'

type Step = 'intro' | 'profile' | 'topics' | 'complete'

function OnboardContent() {
    const { t } = useTranslation()
    const router = useRouter()
    const searchParams = useSearchParams()

    const [step, setStep] = useState<Step>('intro')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [user, setUser] = useState<any>(null)

    // Profile data
    const [bio, setBio] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]) // Now stores subcategory IDs
    const [termsAccepted, setTermsAccepted] = useState(true) // Terms no longer required here

    // Get selected category object for subcategory display
    const activeCategory = selectedCategory ? getCategoryById(selectedCategory) : null

    // Check auth and refresh param
    useEffect(() => {
        async function checkAuth() {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/auth/login?redirect=/host/onboard')
                return
            }
            setUser(session.user)

            // Check if coming back from Stripe (refresh) - no longer needed
            // if (searchParams.get('refresh') === 'true') { setStep('stripe') }
        }
        checkAuth()
    }, [router, searchParams])

    const handleTopicToggle = (topicId: string) => {
        setSelectedTopics(prev =>
            prev.includes(topicId)
                ? prev.filter(t => t !== topicId)
                : [...prev, topicId]
        )
    }

    const handleCompleteOnboarding = async () => {
        setLoading(true)
        setError(null)

        try {
            // Create host profile (no Stripe required)
            const response = await fetch('/api/hosts/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ bio, topics: selectedTopics }),
            })

            const data = await response.json()

            if (!response.ok) {
                const errorMessage = data.details ? `${data.error}: ${data.details}` : data.error || 'Failed to create host profile'
                throw new Error(errorMessage)
            }

            // Success! Redirect to create first pin
            setStep('complete')
        } catch (err: any) {
            setError(err.message)
            setLoading(false)
        }
    }

    const renderIntro = () => (
        <div className="text-center max-w-lg mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <i className="fa-solid fa-handshake text-white text-4xl"></i>
            </div>
            <h1 className="text-3xl font-black mb-4">{t('host.onboard.title')}</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
                {t('host.onboard.subtitle')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                        <i className="fa-solid fa-user-pen text-blue-600"></i>
                    </div>
                    <h3 className="font-bold mb-1">{t('host.onboard.createProfile')}</h3>
                    <p className="text-sm text-gray-500">{t('host.onboard.createProfileDesc')}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                        <i className="fa-solid fa-wallet text-purple-600"></i>
                    </div>
                    <h3 className="font-bold mb-1">{t('host.onboard.setUpPayments')}</h3>
                    <p className="text-sm text-gray-500">{t('host.onboard.setUpPaymentsDesc')}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                        <i className="fa-solid fa-utensils text-green-600"></i>
                    </div>
                    <h3 className="font-bold mb-1">{t('host.onboard.startHosting')}</h3>
                    <p className="text-sm text-gray-500">{t('host.onboard.startHostingDesc')}</p>
                </div>
            </div>

            <button
                onClick={() => setStep('profile')}
                className="pl-btn pl-btn-primary text-lg px-12"
            >
                {t('host.onboard.btn')} <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
        </div>
    )

    const renderProfile = () => (
        <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-black mb-2">{t('host.onboard.aboutYou')}</h2>
            <p className="text-gray-500 mb-6">{t('host.onboard.aboutYouDesc')}</p>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        {t('host.onboard.yourBio')}
                    </label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="I'm a software engineer with 10 years of experience. I love helping people learn to code and discussing tech trends..."
                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                        rows={5}
                    />
                    <p className="text-xs text-gray-400 mt-1">{bio.length}/500 characters</p>
                </div>

                <div className="flex justify-between pt-4">
                    <button
                        onClick={() => setStep('intro')}
                        className="pl-btn pl-btn-secondary"
                    >
                        <i className="fa-solid fa-arrow-left mr-2"></i> Back
                    </button>
                    <button
                        onClick={() => setStep('topics')}
                        disabled={bio.length < 20}
                        className="pl-btn pl-btn-primary disabled:opacity-50"
                    >
                        Continue <i className="fa-solid fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </div>
        </div>
    )

    const renderTopics = () => (
        <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-black mb-2">Your Topics</h2>
            <p className="text-gray-500 mb-2">Select up to 6 topics you'd like to discuss with guests.</p>
            <p className="text-sm font-bold text-gray-700 mb-6">
                <span className={selectedTopics.length >= 6 ? 'text-red-500' : 'text-green-600'}>
                    {selectedTopics.length}/6 selected
                </span>
            </p>

            {/* All Categories with Expandable Subcategories */}
            <div className="space-y-4 mb-8">
                {categories.map(cat => {
                    const isExpanded = selectedCategory === cat.id
                    const categoryTopicCount = cat.subcategories.filter(sub =>
                        selectedTopics.includes(`${cat.id}:${sub.id}`)
                    ).length

                    return (
                        <div key={cat.id} className="border border-gray-200 rounded-xl overflow-hidden">
                            <button
                                onClick={() => setSelectedCategory(isExpanded ? null : cat.id)}
                                className="w-full p-4 flex items-center justify-between bg-white hover:bg-gray-50 transition"
                            >
                                <div className="flex items-center">
                                    <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center mr-3`}>
                                        <i className={`fa-solid ${cat.icon}`}></i>
                                    </div>
                                    <div className="text-left">
                                        <span className="font-bold text-sm block">{cat.label}</span>
                                        <span className="text-xs text-gray-400">{cat.subcategories.length} topics</span>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    {categoryTopicCount > 0 && (
                                        <span className="bg-black text-white text-xs font-bold px-2 py-1 rounded-full mr-2">
                                            {categoryTopicCount}
                                        </span>
                                    )}
                                    <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-gray-400`}></i>
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="p-4 bg-gray-50 border-t border-gray-200">
                                    <div className="flex flex-wrap gap-2">
                                        {cat.subcategories.map(sub => {
                                            const topicKey = `${cat.id}:${sub.id}`
                                            const isSelected = selectedTopics.includes(topicKey)
                                            const canSelect = selectedTopics.length < 6 || isSelected

                                            return (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => canSelect && handleTopicToggle(topicKey)}
                                                    disabled={!canSelect}
                                                    className={`px-3 py-2 rounded-full text-sm font-medium transition ${isSelected
                                                        ? 'bg-black text-white'
                                                        : canSelect
                                                            ? 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200'
                                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        }`}
                                                >
                                                    {sub.label}
                                                    {isSelected && (
                                                        <i className="fa-solid fa-check ml-1.5 text-xs"></i>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Selected Topics Summary */}
            {selectedTopics.length > 0 && (
                <div className="mb-6 p-4 bg-green-50 rounded-xl">
                    <p className="text-sm font-bold text-green-800 mb-2">Your selected topics:</p>
                    <div className="flex flex-wrap gap-2">
                        {selectedTopics.map(topicKey => {
                            const [catId, subId] = topicKey.split(':')
                            const cat = getCategoryById(catId)
                            const sub = cat?.subcategories.find(s => s.id === subId)
                            return (
                                <span key={topicKey} className="bg-white text-green-800 px-2 py-1 rounded-full text-xs font-medium border border-green-200">
                                    {sub?.label || topicKey}
                                    <button
                                        onClick={() => handleTopicToggle(topicKey)}
                                        className="ml-1 text-green-600 hover:text-red-500"
                                    >
                                        <i className="fa-solid fa-times"></i>
                                    </button>
                                </span>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="flex justify-between">
                <button
                    onClick={() => setStep('profile')}
                    className="pl-btn pl-btn-secondary"
                >
                    <i className="fa-solid fa-arrow-left mr-2"></i> Back
                </button>
                <button
                    onClick={handleCompleteOnboarding}
                    disabled={selectedTopics.length === 0 || loading}
                    className="pl-btn pl-btn-primary disabled:opacity-50"
                >
                    {loading ? (
                        <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Creating...</>
                    ) : (
                        <>Complete <i className="fa-solid fa-check ml-2"></i></>
                    )}
                </button>
            </div>
        </div>
    )

    const renderComplete = () => (
        <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <i className="fa-solid fa-check text-white text-4xl"></i>
            </div>
            <h2 className="text-2xl font-black mb-2">You're All Set! 🎉</h2>
            <p className="text-gray-500 mb-8">
                Your host profile has been created. Now create your first pin to start accepting bookings.
            </p>

            <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
                <div className="flex items-start">
                    <i className="fa-solid fa-info-circle text-blue-500 mt-1 mr-3"></i>
                    <div>
                        <p className="text-sm font-medium text-blue-700">Wallet Setup</p>
                        <p className="text-xs text-blue-600 mt-1">
                            You can set up your payment wallet later in Settings → Wallet. You'll need to complete this before accepting bookings.
                        </p>
                    </div>
                </div>
            </div>

            <Link
                href="/host/locations/new"
                className="pl-btn pl-btn-primary text-lg px-12 w-full mb-4"
            >
                <i className="fa-solid fa-map-pin mr-2"></i>
                Create Your First Pin
            </Link>

            <Link
                href="/host/dashboard"
                className="block text-gray-500 hover:text-gray-700 text-sm"
            >
                Go to Dashboard →
            </Link>
        </div>
    )

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 py-4 flex justify-between items-center sticky top-0 z-50">
                <Link href="/" className="pl-logo text-xl">
                    POWER<span>LUNCH</span>.
                </Link>
                <LanguageToggle />
            </header>

            {/* Progress Bar */}
            {step !== 'intro' && (
                <div className="bg-white border-b border-gray-100 px-4 py-3">
                    <div className="max-w-lg mx-auto">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="font-bold text-gray-700">
                                Step {step === 'profile' ? '1' : step === 'topics' ? '2' : '3'} of 3
                            </span>
                            <span className="text-gray-400">
                                {step === 'profile' ? 'About You' : step === 'topics' ? 'Expertise' : 'Payments'}
                            </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-black transition-all duration-300"
                                style={{ width: step === 'profile' ? '33%' : step === 'topics' ? '66%' : '100%' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="px-4 py-12">
                {step === 'intro' && renderIntro()}
                {step === 'profile' && renderProfile()}
                {step === 'topics' && renderTopics()}
                {step === 'complete' && renderComplete()}
            </main>
        </div>
    )
}

export default function HostOnboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
            <OnboardContent />
        </Suspense>
    )
}
