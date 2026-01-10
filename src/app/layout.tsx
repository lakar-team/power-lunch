import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import { Providers } from './providers'
import FooterNav from '@/components/FooterNav'

const notoSansJP = Noto_Sans_JP({
    subsets: ['latin'],
    weight: ['300', '400', '500', '700', '900'],
    variable: '--font-noto-sans-jp',
})

export const metadata: Metadata = {
    title: 'Power Lunch - Micro-sessions over lunch',
    description: 'Connect with interesting people over a quick meal. Learn, network, and grow - one lunch at a time.',
    keywords: ['lunch', 'networking', 'micro-learning', 'Japan', 'conversation'],
    openGraph: {
        title: 'Power Lunch',
        description: 'Micro-sessions over lunch',
        type: 'website',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ja" className={notoSansJP.variable}>
            <head>
                <link
                    rel="stylesheet"
                    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
                />
            </head>
            <body className={`${notoSansJP.className} pb-20 md:pb-0`}>
                <Providers>
                    {children}
                    <FooterNav />
                </Providers>
            </body>
        </html>
    )
}
