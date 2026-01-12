'use client'

import Link from 'next/link'
import { LanguageToggle, useTranslation } from '@/lib/i18n/translations'

export default function PrivacyPage() {
    const { language } = useTranslation()

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <Link href="/" className="pl-logo">POWER<span>LUNCH</span>.</Link>
                    <LanguageToggle />
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-6 py-12">
                {language === 'ja' ? (
                    <>
                        <h1 className="text-3xl font-black mb-8">プライバシーポリシー</h1>

                        <div className="prose prose-gray max-w-none space-y-6">
                            <p className="text-gray-600">最終更新日: 2026年1月</p>

                            <section>
                                <h2 className="text-xl font-bold mt-8 mb-4">1. 収集する情報</h2>
                                <p>Power Lunchは、サービス提供のために以下の情報を収集します：</p>
                                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                    <li>アカウント情報（氏名、メールアドレス）</li>
                                    <li>プロフィール情報（自己紹介、専門分野、写真）</li>
                                    <li>決済情報（Stripeを通じて安全に処理されます）</li>
                                    <li>利用履歴（予約、セッション履歴）</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold mt-8 mb-4">2. 情報の利用目的</h2>
                                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                    <li>サービスの提供と改善</li>
                                    <li>予約の処理と通知</li>
                                    <li>決済処理</li>
                                    <li>カスタマーサポート</li>
                                    <li>サービスの安全性確保</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold mt-8 mb-4">3. 情報の共有</h2>
                                <p>お客様の情報は以下の場合に限り第三者と共有されます：</p>
                                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                    <li>決済処理のためStripeと共有</li>
                                    <li>法的要請に基づく場合</li>
                                    <li>お客様の同意がある場合</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold mt-8 mb-4">4. データの保護</h2>
                                <p>すべてのデータはSSL/TLSで暗号化され、安全に保管されます。クレジットカード情報はPCI DSS準拠のStripeによって処理され、Power Lunchのサーバーには保存されません。</p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold mt-8 mb-4">5. お客様の権利</h2>
                                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                    <li>個人情報へのアクセス権</li>
                                    <li>情報の訂正・削除の要求権</li>
                                    <li>データポータビリティの権利</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold mt-8 mb-4">6. お問い合わせ</h2>
                                <p>プライバシーに関するお問い合わせは下記までご連絡ください：</p>
                                <p className="mt-2">
                                    <a href="mailto:lakar.team@gmail.com" className="text-blue-600 hover:underline">
                                        lakar.team@gmail.com
                                    </a>
                                </p>
                            </section>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="text-3xl font-black mb-8">Privacy Policy</h1>

                        <div className="prose prose-gray max-w-none space-y-6">
                            <p className="text-gray-600">Last updated: January 2026</p>

                            <section>
                                <h2 className="text-xl font-bold mt-8 mb-4">1. Information We Collect</h2>
                                <p>Power Lunch collects the following information to provide our services:</p>
                                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                    <li>Account information (name, email address)</li>
                                    <li>Profile information (bio, expertise, photos)</li>
                                    <li>Payment information (processed securely via Stripe)</li>
                                    <li>Usage data (bookings, session history)</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
                                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                    <li>To provide and improve our services</li>
                                    <li>To process bookings and send notifications</li>
                                    <li>To process payments</li>
                                    <li>To provide customer support</li>
                                    <li>To ensure platform safety and security</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold mt-8 mb-4">3. Information Sharing</h2>
                                <p>We share your information with third parties only in the following cases:</p>
                                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                    <li>With Stripe for payment processing</li>
                                    <li>When required by law</li>
                                    <li>With your explicit consent</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold mt-8 mb-4">4. Data Security</h2>
                                <p>All data is encrypted using SSL/TLS and stored securely. Credit card information is processed by Stripe (PCI DSS compliant) and is never stored on Power Lunch servers.</p>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold mt-8 mb-4">5. Your Rights</h2>
                                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                    <li>Right to access your personal data</li>
                                    <li>Right to request correction or deletion</li>
                                    <li>Right to data portability</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-xl font-bold mt-8 mb-4">6. Contact Us</h2>
                                <p>For privacy-related inquiries, please contact us at:</p>
                                <p className="mt-2">
                                    <a href="mailto:lakar.team@gmail.com" className="text-blue-600 hover:underline">
                                        lakar.team@gmail.com
                                    </a>
                                </p>
                            </section>
                        </div>
                    </>
                )}

                <div className="mt-12 pt-8 border-t border-gray-200">
                    <Link href="/" className="text-blue-600 hover:underline">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
