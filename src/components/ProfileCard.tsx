'use client'

import { useState } from 'react'

interface Profile {
    id: string
    name: string
    content: string
    is_main: boolean
}

interface ProfileCardProps {
    profile: Profile
    onUpdate: (id: string, data: { name: string; content: string }) => Promise<void>
    onDelete?: (id: string) => Promise<void>  // Not available for main profile
}

export default function ProfileCard({ profile, onUpdate, onDelete }: ProfileCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(profile.name)
    const [content, setContent] = useState(profile.content)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        setSaving(true)
        await onUpdate(profile.id, { name, content })
        setSaving(false)
        setIsEditing(false)
    }

    const handleCancel = () => {
        setName(profile.name)
        setContent(profile.content)
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                <div className="mb-3">
                    {profile.is_main ? (
                        <div className="flex items-center mb-2">
                            <i className="fa-solid fa-star text-yellow-500 mr-2"></i>
                            <span className="text-sm font-bold text-gray-600">Main Profile</span>
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Profile name"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            maxLength={100}
                        />
                    )}
                </div>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your introduction..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                />
                <div className="flex justify-end gap-2 mt-3">
                    <button
                        onClick={handleCancel}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !content.trim()}
                        className="px-4 py-1.5 text-sm bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="border border-gray-100 bg-gray-50 rounded-xl p-4 group hover:border-gray-200 transition">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center">
                    {profile.is_main && (
                        <i className="fa-solid fa-star text-yellow-500 mr-2"></i>
                    )}
                    <span className="font-bold text-gray-800">{profile.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit"
                    >
                        <i className="fa-solid fa-pen text-xs"></i>
                    </button>
                    {!profile.is_main && onDelete && (
                        <button
                            onClick={() => onDelete(profile.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                        >
                            <i className="fa-solid fa-trash text-xs"></i>
                        </button>
                    )}
                </div>
            </div>
            <p className="text-sm text-gray-600 line-clamp-3">{profile.content}</p>
        </div>
    )
}
