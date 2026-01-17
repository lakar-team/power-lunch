'use client'

import Link from 'next/link'

interface HostPin {
    id: string
    title: string
    price_yen: number
    central_address?: string
    category?: string
}

interface HostPinCardProps {
    pin: HostPin
    onDelete?: (id: string) => void
}

export default function HostPinCard({ pin, onDelete }: HostPinCardProps) {
    return (
        <div className="border border-gray-100 bg-gray-50 rounded-xl p-4 group hover:border-gray-200 transition">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h4 className="font-bold text-gray-800 line-clamp-1">{pin.title}</h4>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="font-medium text-green-600">¥{pin.price_yen.toLocaleString()}</span>
                        {pin.central_address && (
                            <span className="flex items-center">
                                <i className="fa-solid fa-location-dot mr-1 text-xs"></i>
                                {pin.central_address.split(',')[0]}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Link
                        href={`/host/locations/${pin.id}/edit`}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Edit"
                    >
                        <i className="fa-solid fa-pen text-xs"></i>
                    </Link>
                    {onDelete && (
                        <button
                            onClick={() => onDelete(pin.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                            title="Delete"
                        >
                            <i className="fa-solid fa-trash text-xs"></i>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
