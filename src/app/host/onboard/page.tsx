'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { supabase } from '@/lib/supabase/client'
import { categories, getCategoryById, Subcategory } from '@/lib/categories'

type Step = 'intro' | 'profile' | 'topics' | 'stripe'

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
    const [termsAccepted, setTermsAccepted] = useState(false)

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

            // Check if coming back from Stripe (refresh)
            if (searchParams.get('refresh') === 'true') {
                setStep('stripe')
            }
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

    const handleStartStripeOnboarding = async () => {
        setLoading(true)
        setError(null)

        try {
            // First, update the profile with bio and topics
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ bio })
                .eq('id', user.id)

            if (profileError) {
                console.error('Profile update error:', profileError)
            }

            // Call API to start Stripe onboarding
            const response = await fetch('/api/hosts/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Send auth cookies
                body: JSON.stringify({ bio, topics: selectedTopics }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to start onboarding')
            }

            // Redirect to Stripe
            window.location.href = data.url
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
            <h1 className="text-3xl font-black mb-4">Become a Host</h1>
            <p className="text-gray-600 mb-8 leading-relaxed">
                Share your knowledge, earn money, and connect with amazing people over lunch.
                It only takes a few minutes to get started.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                        <i className="fa-solid fa-user-pen text-blue-600"></i>
                    </div>
                    <h3 className="font-bold mb-1">Create Profile</h3>
                    <p className="text-sm text-gray-500">Tell us about yourself and your expertise</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                        <i className="fa-solid fa-wallet text-purple-600"></i>
                    </div>
                    <h3 className="font-bold mb-1">Set Up Payments</h3>
                    <p className="text-sm text-gray-500">Connect Stripe to receive earnings</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                        <i className="fa-solid fa-utensils text-green-600"></i>
                    </div>
                    <h3 className="font-bold mb-1">Start Hosting</h3>
                    <p className="text-sm text-gray-500">Create listings and meet guests</p>
                </div>
            </div>

            <button
                onClick={() => setStep('profile')}
                className="pl-btn pl-btn-primary text-lg px-12"
            >
                Get Started <i className="fa-solid fa-arrow-right ml-2"></i>
            </button>
        </div>
    )

    const renderProfile = () => (
        <div className="max-w-lg mx-auto">
            <h2 className="text-2xl font-black mb-2">About You</h2>
            <p className="text-gray-500 mb-6">Tell potential guests what makes you a great lunch companion.</p>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Your Bio
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
            <h2 className="text-2xl font-black mb-2">Your Expertise</h2>
            <p className="text-gray-500 mb-6">Select a category and pick topics you'd like to discuss with guests.</p>

            {/* Main Category Selection */}
            <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                    Category
                </label>
                <div className="grid grid-cols-2 gap-3">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                setSelectedCategory(cat.id)
                                // Clear topics when changing category
                                setSelectedTopics([])
                            }}
                            className={`p-3 rounded-xl border-2 text-left transition ${selectedCategory === cat.id
                                    ? 'border-black bg-gray-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-center">
                                <div className={`w-10 h-10 ${cat.color} rounded-lg flex items-center justify-center mr-3`}>
                                    <i className={`fa-solid ${cat.icon}`}></i>
                                </div>
                                <div className="flex-1">
                                    <span className="font-bold text-sm block">{cat.label}</span>
                                    <span className="text-xs text-gray-400">{cat.subcategories.length} topics</span>
                                </div>
                                {selectedCategory === cat.id && (
                                    <i className="fa-solid fa-check text-green-500"></i>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Subcategory Selection (shows when main category is selected) */}
            {activeCategory && (
                <div className="mb-8">
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                        Select Topics in {activeCategory.label}
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {activeCategory.subcategories.map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => handleTopicToggle(sub.id)}
                                className={`px-3 py-2 rounded-full text-sm font-medium transition ${selectedTopics.includes(sub.id)
                                        ? 'bg-black text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {sub.label}
                                {selectedTopics.includes(sub.id) && (
                                    <i className="fa-solid fa-check ml-1.5 text-xs"></i>
                                )}
                            </button>
                        ))}
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
                    onClick={() => setStep('stripe')}
                    disabled={selectedTopics.length === 0}
                    className="pl-btn pl-btn-primary disabled:opacity-50"
                >
                    Continue <i className="fa-solid fa-arrow-right ml-2"></i>
                </button>
            </div>
        </div>
    )

    const renderStripe = () => (
        <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <i className="fa-brands fa-stripe text-white text-4xl"></i>
            </div>
            <h2 className="text-2xl font-black mb-2">Set Up Payments</h2>
            <p className="text-gray-500 mb-6">
                We partner with Stripe to securely process payments. You'll receive payouts directly to your bank account.
            </p>

            <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
                <h3 className="font-bold mb-4">What you'll need:</h3>
                <ul className="space-y-3">
                    <li className="flex items-start">
                        <i className="fa-solid fa-check-circle text-green-500 mt-1 mr-3"></i>
                        <span className="text-sm text-gray-600">Valid ID (driver's license, passport, etc.)</span>
                    </li>
                    <li className="flex items-start">
                        <i className="fa-solid fa-check-circle text-green-500 mt-1 mr-3"></i>
                        <span className="text-sm text-gray-600">Bank account details for receiving payouts</span>
                    </li>
                    <li className="flex items-start">
                        <i className="fa-solid fa-check-circle text-green-500 mt-1 mr-3"></i>
                        <span className="text-sm text-gray-600">Basic business information</span>
                    </li>
                </ul>
            </div>

            {/* Terms Acceptance */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 text-left">
                <label className="flex items-start cursor-pointer">
                    <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-1 mr-3 w-5 h-5 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <span className="text-sm text-gray-700">
                        I have read and agree to the{' '}
                        <Link href="/terms" target="_blank" className="text-blue-600 hover:underline font-medium">
                            Terms of Service
                        </Link>
                        , including the platform fee structure (15%), tax responsibilities, and limitation of liability.
                        I understand that Power Lunch acts as an intermediary and I am responsible for my own tax obligations.
                    </span>
                </label>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 text-sm">
                    {error}
                </div>
            )}

            <button
                onClick={handleStartStripeOnboarding}
                disabled={loading || !termsAccepted}
                className="pl-btn pl-btn-success text-lg px-12 w-full mb-4 disabled:opacity-50"
            >
                {loading ? (
                    <>
                        <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                        Connecting to Stripe...
                    </>
                ) : (
                    <>
                        <i className="fa-brands fa-stripe-s mr-2"></i>
                        Continue with Stripe
                    </>
                )}
            </button>

            <button
                onClick={() => setStep('topics')}
                className="text-gray-500 hover:text-gray-700 text-sm"
            >
                <i className="fa-solid fa-arrow-left mr-1"></i> Go back
            </button>

            <p className="text-xs text-gray-400 mt-6">
                Your information is securely handled by Stripe. Power Lunch never stores your banking details.
            </p>
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
                {step === 'stripe' && renderStripe()}
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
