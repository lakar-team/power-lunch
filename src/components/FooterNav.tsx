'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslation } from '@/lib/i18n/translations'

interface NavItem {
    key: string
    icon: string
    iconActive: string
    href: string
    labelKey: 'nav.explore' | 'nav.myPlans' | 'nav.inbox' | 'nav.profile'
}

const navItems: NavItem[] = [
    {
        key: 'explore',
        icon: 'fa-solid fa-map-location-dot',
        iconActive: 'fa-solid fa-map-location-dot',
        href: '/search',
        labelKey: 'nav.explore',
    },
    {
        key: 'plans',
        icon: 'fa-regular fa-calendar-check',
        iconActive: 'fa-solid fa-calendar-check',
        href: '/bookings',
        labelKey: 'nav.myPlans',
    },
    {
        key: 'inbox',
        icon: 'fa-regular fa-message',
        iconActive: 'fa-solid fa-message',
        href: '/inbox',
        labelKey: 'nav.inbox',
    },
    {
        key: 'profile',
        icon: 'fa-regular fa-user',
        iconActive: 'fa-solid fa-user',
        href: '/profile',
        labelKey: 'nav.profile',
    },
]

export default function FooterNav() {
    const pathname = usePathname()
    const { t } = useTranslation()

    // Don't show footer nav on landing page, auth pages, OR host pages
    const hideOnPaths = ['/', '/auth/login', '/auth/signup']
    if (hideOnPaths.includes(pathname) || pathname.startsWith('/host')) {
        return null
    }

    return (
        <nav className="pl-footer-nav">
            {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={`pl-footer-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <i className={isActive ? item.iconActive : item.icon}></i>
                        <span>{t(item.labelKey)}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
