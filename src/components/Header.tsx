'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'
import { useAuth } from '@/components/AuthProvider'

interface HeaderProps {
    /** If true, use transparent style (for landing page hero) */
    transparent?: boolean
    /** Additional class names */
    className?: string
}

export default function Header({ transparent = false, className = '' }: HeaderProps) {
    const router = useRouter()
    const { t } = useTranslation()
    const { user, loading, signOut } = useAuth()

    const handleLogout = async () => {
        await signOut()
        router.push('/')
    }

    const baseClass = transparent
        ? 'bg-transparent text-white'
        : 'bg-white border-b border-gray-100 text-gray-800'

    return (
        <header className={`px-4 py-4 flex justify-between items-center ${baseClass} ${className}`}>
            <Link href={user ? '/search' : '/'} className="pl-logo">
                POWER<span>LUNCH</span>.
            </Link>
            <div className="flex items-center space-x-3">
                <LanguageToggle />
                {!loading && (
                    user ? (
                        <>
                            <Link
                                href="/profile"
                                className={`p-2 rounded-full hover:bg-gray-100 transition ${transparent ? 'hover:bg-white/20' : ''}`}
                                title={t('nav.profile')}
                            >
                                <i className="fa-solid fa-user text-lg"></i>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className={`p-2 rounded-full hover:bg-gray-100 transition ${transparent ? 'hover:bg-white/20' : ''}`}
                                title={t('nav.logout')}
                            >
                                <i className="fa-solid fa-right-from-bracket text-lg"></i>
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/auth/login"
                            className={`text-sm font-bold px-4 py-2 rounded-full transition ${transparent
                                    ? 'border border-white/30 hover:bg-white hover:text-black'
                                    : 'bg-black text-white hover:bg-gray-800'
                                }`}
                        >
                            {t('nav.login')}
                        </Link>
                    )
                )}
            </div>
        </header>
    )
}
