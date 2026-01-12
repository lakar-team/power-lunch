'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'en' | 'ja'

const translations = {
    en: {
        // Header
        'nav.login': 'Login',
        'nav.signup': 'Get Started',
        'nav.logout': 'Logout',

        // Footer Navigation
        'nav.explore': 'Explore',
        'nav.myPlans': 'My Plans',
        'nav.inbox': 'Inbox',
        'nav.profile': 'Profile',

        // Home Page
        'home.hero.title': 'Turn Lunch into',
        'home.hero.titleHighlight': 'Learning',
        'home.hero.subtitle': 'Learn new skills or meet interesting people in 30-minute micro-sessions. Make the most of your lunch break.',
        'home.hero.searchBtn': 'Find a Host',
        'home.hero.hostBtn': 'Become a Host',

        'home.howItWorks': 'How It Works',
        'home.step1.title': '1. Find a Host',
        'home.step1.desc': 'Browse hosts by topic or location on the map',
        'home.step2.title': '2. Book a Session',
        'home.step2.desc': 'Pick a convenient time and book instantly',
        'home.step3.title': '3. Meet & Learn',
        'home.step3.desc': 'Enjoy a 30-minute session at a cafe or restaurant',

        'home.categories': 'Popular Categories',
        'home.category.english': 'English',
        'home.category.programming': 'Programming',
        'home.category.design': 'Design',
        'home.category.business': 'Business',
        'home.category.cooking': 'Cooking',
        'home.category.music': 'Music',
        'home.category.photography': 'Photography',
        'home.category.other': 'Other',

        'home.cta.title': 'Want to share your skills?',
        'home.cta.subtitle': 'Use your lunch break to share your experience and earn extra income.',
        'home.cta.btn': 'Register as Host',

        'footer.about': 'About',
        'footer.privacy': 'Privacy',
        'footer.terms': 'Terms',
        'footer.contact': 'Contact',

        // Auth
        'auth.login.title': 'Welcome Back',
        'auth.login.subtitle': 'Log in to your account',
        'auth.login.email': 'Email Address',
        'auth.login.password': 'Password',
        'auth.login.forgot': 'Forgot password?',
        'auth.login.btn': 'Log In',
        'auth.login.loading': 'Logging in...',
        'auth.login.noAccount': "Don't have an account?",
        'auth.login.signupLink': 'Sign Up',

        'auth.signup.title': 'Create Account',
        'auth.signup.subtitle': 'Start your journey',
        'auth.signup.name': 'Full Name',
        'auth.signup.email': 'Email Address',
        'auth.signup.password': 'Password',
        'auth.signup.btn': 'Sign Up',
        'auth.signup.loading': 'Creating account...',
        'auth.signup.hasAccount': 'Already have an account?',
        'auth.signup.loginLink': 'Log In',

        // Search
        'search.title': 'Find a Host',
        'search.placeholder': 'Search by topic, name, or location',
        'search.noResults': 'No hosts found',
        'search.loading': 'Searching...',

        // Host Onboard
        'host.onboard.title': 'Become a Host',
        'host.onboard.subtitle': 'Share your knowledge, earn money, and connect with amazing people over lunch. It only takes a few minutes to get started.',
        'host.onboard.btn': 'Get Started',
        'host.onboard.loading': 'Setting up...',
        'host.onboard.createProfile': 'Create Profile',
        'host.onboard.createProfileDesc': 'Tell us about yourself and your expertise',
        'host.onboard.setUpPayments': 'Set Up Payments',
        'host.onboard.setUpPaymentsDesc': 'Connect Stripe to receive earnings',
        'host.onboard.startHosting': 'Start Hosting',
        'host.onboard.startHostingDesc': 'Create listings and meet guests',
        'host.onboard.aboutYou': 'About You',
        'host.onboard.aboutYouDesc': 'Tell potential guests what makes you a great lunch companion.',
        'host.onboard.yourBio': 'Your Bio',
        'host.onboard.expertise': 'Your Expertise',
        'host.onboard.expertiseDesc': 'Choose categories that match your skills.',

        // Profile Page
        'profile.hosting': 'Hosting',
        'profile.wallet': 'Wallet',
        'profile.newMember': 'New Member',
        'profile.noPlans': 'No upcoming plans',
        'profile.findHost': 'Find a host nearby to learn something new.',
        'profile.findSession': 'Find a Session',
        'profile.upcoming': 'Upcoming',
        'profile.view': 'View',
        'profile.settingsSoon': 'Settings coming soon!',
        'profile.loadingBookings': 'Loading bookings...',

        // Common
        'common.loading': 'Loading...',
        'common.error': 'An error occurred',
        'common.retry': 'Try Again',
        'common.back': 'Back',
        'common.next': 'Next',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.underConstruction': 'This feature is currently under development.',
    },
    ja: {
        // Header
        'nav.login': 'ログイン',
        'nav.signup': '始める',
        'nav.logout': 'ログアウト',

        // Footer Navigation
        'nav.explore': '探す',
        'nav.myPlans': '予定',
        'nav.inbox': 'メッセージ',
        'nav.profile': 'プロフィール',

        // Home Page
        'home.hero.title': 'ランチを、',
        'home.hero.titleHighlight': '学び',
        'home.hero.subtitle': '30分のミニセッションで、新しいスキルを学んだり、面白い人と出会ったり。ランチタイムを有効活用しよう。',
        'home.hero.searchBtn': 'ホストを探す',
        'home.hero.hostBtn': 'ホストになる',

        'home.howItWorks': '使い方',
        'home.step1.title': '1. ホストを探す',
        'home.step1.desc': '興味のあるトピックや近くのホストを地図から探そう',
        'home.step2.title': '2. 予約する',
        'home.step2.desc': '都合の良い時間を選んで、サクッと予約',
        'home.step3.title': '3. 会って学ぶ',
        'home.step3.desc': 'カフェやレストランで30分のセッションを楽しもう',

        'home.categories': '人気のカテゴリ',
        'home.category.english': '英会話',
        'home.category.programming': 'プログラミング',
        'home.category.design': 'デザイン',
        'home.category.business': 'ビジネス',
        'home.category.cooking': '料理',
        'home.category.music': '音楽',
        'home.category.photography': '写真',
        'home.category.other': 'その他',

        'home.cta.title': 'あなたのスキルを共有しませんか？',
        'home.cta.subtitle': 'ランチタイムを使って、経験やスキルを共有しよう。お小遣い稼ぎにもなります。',
        'home.cta.btn': 'ホスト登録する',

        'footer.about': 'About',
        'footer.privacy': 'プライバシー',
        'footer.terms': '利用規約',
        'footer.contact': 'お問い合わせ',

        // Auth
        'auth.login.title': 'おかえりなさい',
        'auth.login.subtitle': 'アカウントにログイン',
        'auth.login.email': 'メールアドレス',
        'auth.login.password': 'パスワード',
        'auth.login.forgot': 'パスワードをお忘れですか？',
        'auth.login.btn': 'ログイン',
        'auth.login.loading': 'ログイン中...',
        'auth.login.noAccount': 'アカウントをお持ちでないですか？',
        'auth.login.signupLink': '新規登録',

        'auth.signup.title': 'アカウント作成',
        'auth.signup.subtitle': '新しい出会いを始めよう',
        'auth.signup.name': 'お名前',
        'auth.signup.email': 'メールアドレス',
        'auth.signup.password': 'パスワード',
        'auth.signup.btn': '登録する',
        'auth.signup.loading': '登録中...',
        'auth.signup.hasAccount': 'すでにアカウントをお持ちですか？',
        'auth.signup.loginLink': 'ログイン',

        // Search
        'search.title': 'ホストを探す',
        'search.placeholder': 'トピック、名前、場所で検索',
        'search.noResults': 'ホストが見つかりませんでした',
        'search.loading': '検索中...',

        // Host Onboard
        'host.onboard.title': 'ホストになる',
        'host.onboard.subtitle': 'ランチタイムを活用して、知識を共有し、収入を得ながら素敵な人々と出会おう。開始まで数分です。',
        'host.onboard.btn': '始める',
        'host.onboard.loading': '準備中...',
        'host.onboard.createProfile': 'プロフィール作成',
        'host.onboard.createProfileDesc': '自己紹介と専門分野を教えてください',
        'host.onboard.setUpPayments': '支払い設定',
        'host.onboard.setUpPaymentsDesc': 'Stripeを連携して収益を受け取る',
        'host.onboard.startHosting': 'ホスト開始',
        'host.onboard.startHostingDesc': 'リスティングを作成してゲストと出会う',
        'host.onboard.aboutYou': 'あなたについて',
        'host.onboard.aboutYouDesc': 'ゲストに素敵なランチパートナーであることを伝えましょう。',
        'host.onboard.yourBio': '自己紹介',
        'host.onboard.expertise': '専門分野',
        'host.onboard.expertiseDesc': 'あなたのスキルに合ったカテゴリを選択してください。',

        // Profile Page
        'profile.hosting': 'ホスティング',
        'profile.wallet': 'ウォレット',
        'profile.newMember': '新規メンバー',
        'profile.noPlans': '予定はありません',
        'profile.findHost': '近くのホストを探してみましょう。',
        'profile.findSession': 'セッションを探す',
        'profile.upcoming': '今後の予定',
        'profile.view': '表示',
        'profile.settingsSoon': '設定は近日公開!',
        'profile.loadingBookings': '予約を読み込み中...',

        // Common
        'common.loading': '読み込み中...',
        'common.error': 'エラーが発生しました',
        'common.retry': '再試行',
        'common.back': '戻る',
        'common.next': '次へ',
        'common.save': '保存',
        'common.cancel': 'キャンセル',
        'common.underConstruction': 'この機能は現在開発中です。',
    },
}

type TranslationKey = keyof typeof translations.en

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en')

    useEffect(() => {
        // Check localStorage for saved preference
        const saved = localStorage.getItem('pl-language') as Language
        if (saved && (saved === 'en' || saved === 'ja')) {
            setLanguage(saved)
        } else {
            // Default to browser language
            const browserLang = navigator.language.startsWith('ja') ? 'ja' : 'en'
            setLanguage(browserLang)
        }
    }, [])

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang)
        localStorage.setItem('pl-language', lang)
    }

    const t = (key: TranslationKey): string => {
        return translations[language][key] || key
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useTranslation() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useTranslation must be used within LanguageProvider')
    }
    return context
}

export function LanguageToggle() {
    const { language, setLanguage } = useTranslation()

    return (
        <button
            onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')}
            className="px-3 py-1 text-sm font-medium border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Toggle language"
        >
            {language === 'en' ? '日本語' : 'English'}
        </button>
    )
}
