'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import CollapsibleSection from '@/components/CollapsibleSection'
import ProfileCard from '@/components/ProfileCard'
import HostPinCard from '@/components/HostPinCard'

interface Profile {
    id: string
    name: string
    content: string
    is_main: boolean
}

interface HostPin {
    id: string
    title: string
    price_yen: number
    central_address?: string
    category?: string
}

export default function HostingTab() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [pins, setPins] = useState<HostPin[]>([])
    const [loading, setLoading] = useState(true)
    const [isHost, setIsHost] = useState(false)
    const [hostId, setHostId] = useState<string | null>(null)

    // New profile form state
    const [showNewProfile, setShowNewProfile] = useState(false)
    const [newProfileName, setNewProfileName] = useState('')
    const [newProfileContent, setNewProfileContent] = useState('')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)

        // Fetch profiles
        const profilesRes = await fetch('/api/hosts/profiles', { credentials: 'include' })
        const profilesData = await profilesRes.json()

        setProfiles(profilesData.profiles || [])
        setIsHost(profilesData.is_host || false)
        setHostId(profilesData.host_id || null)

        // Fetch pins (listings) if host
        if (profilesData.is_host && profilesData.host_id) {
            const pinsRes = await fetch(`/api/hosts/${profilesData.host_id}/listings`, { credentials: 'include' })
            if (pinsRes.ok) {
                const pinsData = await pinsRes.json()
                setPins(pinsData.listings || [])
            }
        }

        setLoading(false)
    }

    const handleCreateProfile = async () => {
        if (!newProfileContent.trim()) return

        setCreating(true)
        const isMain = profiles.length === 0

        const res = await fetch('/api/hosts/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                name: isMain ? 'Main Profile' : newProfileName || 'Sub Profile',
                content: newProfileContent,
                is_main: isMain,
            }),
        })

        if (res.ok) {
            const { profile } = await res.json()
            setProfiles([...profiles, profile])
            setNewProfileName('')
            setNewProfileContent('')
            setShowNewProfile(false)
            setIsHost(true)
        } else {
            const data = await res.json()
            alert(data.error || 'Failed to create profile')
        }
        setCreating(false)
    }

    const handleUpdateProfile = async (id: string, data: { name: string; content: string }) => {
        const res = await fetch(`/api/hosts/profiles/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data),
        })

        if (res.ok) {
            const { profile } = await res.json()
            setProfiles(profiles.map(p => p.id === id ? profile : p))
        }
    }

    const handleDeleteProfile = async (id: string) => {
        if (!confirm('Delete this sub-profile?')) return

        const res = await fetch(`/api/hosts/profiles/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        })

        if (res.ok) {
            setProfiles(profiles.filter(p => p.id !== id))
        }
    }

    if (loading) {
        return (
            <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            </div>
        )
    }

    const mainProfile = profiles.find(p => p.is_main)
    const subProfiles = profiles.filter(p => !p.is_main)
    const canAddSubProfile = subProfiles.length < 5

    return (
        <div className="space-y-4 animate-fade-in-up">
            {/* My Profiles Section */}
            <CollapsibleSection title="My Profiles">
                <div className="space-y-3">
                    {/* Main Profile */}
                    {mainProfile ? (
                        <ProfileCard
                            profile={mainProfile}
                            onUpdate={handleUpdateProfile}
                        />
                    ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i className="fa-solid fa-user-pen text-gray-400"></i>
                            </div>
                            <p className="text-sm font-bold text-gray-600 mb-1">Create Your Main Profile</p>
                            <p className="text-xs text-gray-400 mb-4">This appears on your public host page</p>
                            <button
                                onClick={() => setShowNewProfile(true)}
                                className="bg-black text-white text-sm font-bold px-6 py-2 rounded-full hover:bg-gray-800 transition"
                            >
                                Get Started
                            </button>
                        </div>
                    )}

                    {/* Sub-profiles */}
                    {subProfiles.map(profile => (
                        <ProfileCard
                            key={profile.id}
                            profile={profile}
                            onUpdate={handleUpdateProfile}
                            onDelete={handleDeleteProfile}
                        />
                    ))}

                    {/* Add sub-profile button */}
                    {mainProfile && canAddSubProfile && !showNewProfile && (
                        <button
                            onClick={() => setShowNewProfile(true)}
                            className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-500 hover:border-gray-300 hover:text-gray-700 transition flex items-center justify-center"
                        >
                            <i className="fa-solid fa-plus mr-2"></i>
                            Add Sub-Profile ({5 - subProfiles.length} remaining)
                        </button>
                    )}

                    {/* New profile form */}
                    {showNewProfile && (
                        <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                            {profiles.length === 0 ? (
                                <div className="flex items-center mb-2">
                                    <i className="fa-solid fa-star text-yellow-500 mr-2"></i>
                                    <span className="text-sm font-bold text-gray-600">Main Profile</span>
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    value={newProfileName}
                                    onChange={(e) => setNewProfileName(e.target.value)}
                                    placeholder="Sub-profile name (e.g., English Lessons)"
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                                    maxLength={100}
                                />
                            )}
                            <textarea
                                value={newProfileContent}
                                onChange={(e) => setNewProfileContent(e.target.value)}
                                placeholder="Write your introduction..."
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={4}
                                autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-3">
                                <button
                                    onClick={() => {
                                        setShowNewProfile(false)
                                        setNewProfileName('')
                                        setNewProfileContent('')
                                    }}
                                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateProfile}
                                    disabled={creating || !newProfileContent.trim()}
                                    className="px-4 py-1.5 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Profile'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </CollapsibleSection>

            {/* My Host Pins Section */}
            <CollapsibleSection
                title="My Host Pins"
                action={
                    mainProfile && (
                        <Link
                            href="/host/locations/new"
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center"
                        >
                            <i className="fa-solid fa-plus mr-1"></i> New Pin
                        </Link>
                    )
                }
            >
                <div className="space-y-3">
                    {!mainProfile ? (
                        <div className="text-center py-6 text-gray-400">
                            <p className="text-sm">Create a main profile first to add host pins</p>
                        </div>
                    ) : pins.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i className="fa-solid fa-map-pin text-gray-400"></i>
                            </div>
                            <p className="text-sm font-bold text-gray-600 mb-1">No host pins yet</p>
                            <p className="text-xs text-gray-400 mb-4">Create a pin to start accepting bookings</p>
                            <Link
                                href="/host/locations/new"
                                className="bg-black text-white text-sm font-bold px-6 py-2 rounded-full inline-block hover:bg-gray-800 transition"
                            >
                                <i className="fa-solid fa-plus mr-2"></i>
                                Create Pin
                            </Link>
                        </div>
                    ) : (
                        pins.map(pin => (
                            <HostPinCard key={pin.id} pin={pin} />
                        ))
                    )}
                </div>
            </CollapsibleSection>
        </div>
    )
}
