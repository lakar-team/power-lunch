'use client'

import { LanguageProvider } from '@/lib/i18n/translations'
import { AuthProvider } from '@/components/AuthProvider'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <LanguageProvider>
                {children}
            </LanguageProvider>
        </AuthProvider>
    )
}
