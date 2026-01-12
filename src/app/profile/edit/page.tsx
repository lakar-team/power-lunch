'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/translations'

export default function EditProfilePage() {
    const router = useRouter()
    const { t } = useTranslation()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Form state
    const [fullName, setFullName] = useState('')
    const [bio, setBio] = useState('')
    const [location, setLocation] = useState('')

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login?redirect=/profile/edit')
                return
            }
            setUser(user)
            setFullName(user.user_metadata?.full_name || '')

            // Fetch profile data
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profileData) {
                setProfile(profileData)
                setBio(profileData.bio || '')
                setLocation(profileData.location || '')
            }

            setLoading(false)
        }
        getUser()
    }, [router])

    const handleSave = async () => {
        if (!user) return

        setSaving(true)
        setMessage(null)

        try {
            // Update user metadata (full name)
            const { error: authError } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            })

            if (authError) throw authError

            // Update profile in database
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    bio,
                    location,
                    updated_at: new Date().toISOString()
                })

            if (profileError) throw profileError

            setMessage({ type: 'success', text: 'Profile updated successfully!' })

            // Refresh user data
            const { data: { user: updatedUser } } = await supabase.auth.getUser()
            if (updatedUser) setUser(updatedUser)
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Failed to update profile' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white px-6 py-4 border-b border-gray-100 sticky top-0 z-10">
                <div className="flex items-center justify-between max-w-lg mx-auto">
                    <button onClick={() => router.back()} className="text-gray-600 hover:text-black">
                        <i className="fa-solid fa-arrow-left text-xl"></i>
                    </button>
                    <h1 className="text-lg font-bold">Edit Profile</h1>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="text-blue-600 font-bold hover:text-blue-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </header>

            <div className="max-w-lg mx-auto p-6 space-y-6">
                {/* Message */}
                {message && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Photo */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
                    <div className="relative inline-block">
                        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-white shadow-lg mx-auto">
                            {fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <button className="absolute bottom-0 right-0 bg-black text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition">
                            <i className="fa-solid fa-camera text-sm"></i>
                        </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">Tap to change photo</p>
                </section>

                {/* Basic Info */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Basic Information</h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Your full name"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g., Tokyo, Japan"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
                            />
                        </div>
                    </div>
                </section>

                {/* Bio */}
                <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">About You</h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself, your interests, and what you'd like to learn or teach..."
                            rows={4}
                            maxLength={500}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/500</p>
                    </div>
                </section>

                {/* Save Button (Mobile) */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50 shadow-lg"
                >
                    {saving ? (
                        <span className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Saving...
                        </span>
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>
        </div>
    )
}
