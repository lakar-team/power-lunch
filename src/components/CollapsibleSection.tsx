'use client'

import { useState, ReactNode } from 'react'

interface CollapsibleSectionProps {
    title: string
    defaultOpen?: boolean
    children: ReactNode
    action?: ReactNode  // Optional action button on the right
}

export default function CollapsibleSection({
    title,
    defaultOpen = true,
    children,
    action
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition"
            >
                <div className="flex items-center">
                    <i className={`fa-solid fa-chevron-${isOpen ? 'down' : 'right'} text-gray-400 mr-3 text-xs transition-transform`}></i>
                    <h3 className="font-bold text-gray-800">{title}</h3>
                </div>
                {action && (
                    <div onClick={(e) => e.stopPropagation()}>
                        {action}
                    </div>
                )}
            </button>

            {/* Content */}
            {isOpen && (
                <div className="px-5 pb-5 pt-0 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    )
}
