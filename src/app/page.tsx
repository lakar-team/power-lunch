import Link from 'next/link'

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="pl-logo text-xl">
                        POWER<span>LUNCH</span>.
                    </Link>
                    <div className="flex items-center space-x-4">
                        <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
                            ログイン
                        </Link>
                        <Link href="/auth/signup" className="pl-btn pl-btn-primary text-sm">
                            始める
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="max-w-6xl mx-auto px-4 py-20 text-center">
                <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
                    ランチを、<span className="text-green-500">学び</span>に。
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    30分のミニセッションで、新しいスキルを学んだり、
                    面白い人と出会ったり。ランチタイムを有効活用しよう。
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/search" className="pl-btn pl-btn-primary text-lg px-10">
                        <i className="fa-solid fa-search mr-2"></i>
                        ホストを探す
                    </Link>
                    <Link href="/host/onboard" className="pl-btn pl-btn-secondary text-lg px-10">
                        ホストになる
                    </Link>
                </div>
            </section>

            {/* How It Works */}
            <section className="bg-white py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-black text-center mb-12">使い方</h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fa-solid fa-search text-2xl text-green-600"></i>
                            </div>
                            <h3 className="font-bold text-lg mb-2">1. ホストを探す</h3>
                            <p className="text-gray-600">興味のあるトピックや近くのホストを地図から探そう</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fa-solid fa-calendar-check text-2xl text-blue-600"></i>
                            </div>
                            <h3 className="font-bold text-lg mb-2">2. 予約する</h3>
                            <p className="text-gray-600">都合の良い時間を選んで、サクッと予約</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i className="fa-solid fa-utensils text-2xl text-purple-600"></i>
                            </div>
                            <h3 className="font-bold text-lg mb-2">3. 会って学ぶ</h3>
                            <p className="text-gray-600">カフェやレストランで30分のセッションを楽しもう</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-20">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-black text-center mb-12">人気のカテゴリ</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { name: '英会話', icon: 'fa-language', color: 'bg-red-100 text-red-600' },
                            { name: 'プログラミング', icon: 'fa-code', color: 'bg-blue-100 text-blue-600' },
                            { name: 'デザイン', icon: 'fa-palette', color: 'bg-purple-100 text-purple-600' },
                            { name: 'ビジネス', icon: 'fa-briefcase', color: 'bg-green-100 text-green-600' },
                            { name: '料理', icon: 'fa-utensils', color: 'bg-orange-100 text-orange-600' },
                            { name: '音楽', icon: 'fa-music', color: 'bg-pink-100 text-pink-600' },
                            { name: '写真', icon: 'fa-camera', color: 'bg-yellow-100 text-yellow-600' },
                            { name: 'その他', icon: 'fa-ellipsis', color: 'bg-gray-100 text-gray-600' },
                        ].map((cat) => (
                            <Link
                                key={cat.name}
                                href={`/search?category=${cat.name}`}
                                className="pl-card p-6 flex flex-col items-center hover:shadow-lg"
                            >
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${cat.color}`}>
                                    <i className={`fa-solid ${cat.icon} text-xl`}></i>
                                </div>
                                <span className="font-bold">{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-black text-white py-20">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-black mb-6">あなたのスキルを共有しませんか？</h2>
                    <p className="text-gray-400 mb-8">
                        ランチタイムを使って、経験やスキルを共有しよう。<br />
                        お小遣い稼ぎにもなります。
                    </p>
                    <Link href="/host/onboard" className="pl-btn pl-btn-success text-lg px-10">
                        ホスト登録する
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 py-12">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="pl-logo text-xl mb-4 md:mb-0">
                            POWER<span>LUNCH</span>.
                        </div>
                        <div className="flex space-x-6 text-sm text-gray-500">
                            <Link href="/about">About</Link>
                            <Link href="/privacy">プライバシー</Link>
                            <Link href="/terms">利用規約</Link>
                            <Link href="/contact">お問い合わせ</Link>
                        </div>
                    </div>
                    <p className="text-center text-gray-400 text-sm mt-8">
                        © 2026 Power Lunch. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
