'use client'

import Link from 'next/link'
import { LanguageToggle, useTranslation } from '@/lib/i18n/translations'

export default function CommercialDisclosurePage() {
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
                        <h1 className="text-3xl font-black mb-8">特定商取引法に基づく表記</h1>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left text-sm text-gray-700">
                                <tbody className="divide-y divide-gray-100">
                                    <tr className="bg-gray-50/50">
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">販売業者</th>
                                        <td className="py-4 px-6">
                                            請求があったら遅滞なく開示します
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">代表責任者</th>
                                        <td className="py-4 px-6">
                                            請求があったら遅滞なく開示します
                                        </td>
                                    </tr>
                                    <tr className="bg-gray-50/50">
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">所在地</th>
                                        <td className="py-4 px-6">
                                            〒980-0000<br />
                                            宮城県仙台市<br />
                                            ※請求があったら遅滞なく開示します
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">電話番号</th>
                                        <td className="py-4 px-6">
                                            請求があったら遅滞なく開示します<br />
                                            <span className="text-xs text-gray-500">※お問い合わせはメールにて承っております</span>
                                        </td>
                                    </tr>
                                    <tr className="bg-gray-50/50">
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">メールアドレス</th>
                                        <td className="py-4 px-6">lakar.team@gmail.com</td>
                                    </tr>
                                    <tr>
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">販売価格</th>
                                        <td className="py-4 px-6">各商品（セッション）ページに記載の金額</td>
                                    </tr>
                                    <tr className="bg-gray-50/50">
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">商品代金以外の必要料金</th>
                                        <td className="py-4 px-6">
                                            インターネット接続料金その他の電気通信回線の通信に関する費用はお客様のご負担となります。
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">支払方法</th>
                                        <td className="py-4 px-6">クレジットカード決済（Stripe）</td>
                                    </tr>
                                    <tr className="bg-gray-50/50">
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">支払時期</th>
                                        <td className="py-4 px-6">予約確定時に決済が完了します。</td>
                                    </tr>
                                    <tr>
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">商品の引渡時期</th>
                                        <td className="py-4 px-6">予約したセッションの日時</td>
                                    </tr>
                                    <tr className="bg-gray-50/50">
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">返品・キャンセルについて</th>
                                        <td className="py-4 px-6 space-y-2">
                                            <p><strong>＜お客様都合によるキャンセル＞</strong></p>
                                            <p>セッション開始の24時間前まではキャンセル料はかかりません。</p>
                                            <p>24時間以内のキャンセルは50%のキャンセル料が発生します。</p>
                                            <p><strong>＜サービスに不備がある場合＞</strong></p>
                                            <p>ホストがセッションに現れなかった場合、全額返金いたします。お問い合わせフォームよりご連絡ください。</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="text-3xl font-black mb-8">Commercial Disclosure</h1>
                        <p className="text-gray-500 mb-6 italic">Based on the Specified Commercial Transactions Act (Tokutei Sho-torihiki Ho)</p>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left text-sm text-gray-700">
                                <tbody className="divide-y divide-gray-100">
                                    <tr className="bg-gray-50/50">
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">Legal Name</th>
                                        <td className="py-4 px-6">
                                            We will disclose without delay if requested.
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">Representative</th>
                                        <td className="py-4 px-6">
                                            We will disclose without delay if requested.
                                        </td>
                                    </tr>
                                    <tr className="bg-gray-50/50">
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">Address</th>
                                        <td className="py-4 px-6">
                                            Sendai, Miyagi Prefecture<br />
                                            (We will disclose full address without delay if requested)
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">Phone Number</th>
                                        <td className="py-4 px-6">
                                            We will disclose without delay if requested.<br />
                                            <span className="text-xs text-gray-500">*Please contact us via email for support.</span>
                                        </td>
                                    </tr>
                                    <tr className="bg-gray-50/50">
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">Email Address</th>
                                        <td className="py-4 px-6">lakar.team@gmail.com</td>
                                    </tr>
                                    <tr>
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">Selling Price</th>
                                        <td className="py-4 px-6">Displayed on each session listing page.</td>
                                    </tr>
                                    <tr className="bg-gray-50/50">
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">Additional Fees</th>
                                        <td className="py-4 px-6">
                                            Internet connection and communication fees are the responsibility of the customer.
                                        </td>
                                    </tr>
                                    <tr>
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">Payment Method</th>
                                        <td className="py-4 px-6">Credit Card (processed via Stripe)</td>
                                    </tr>
                                    <tr className="bg-gray-50/50">
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">Payment Period</th>
                                        <td className="py-4 px-6">Payments are processed immediately upon booking confirmation.</td>
                                    </tr>
                                    <tr>
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">Delivery Time</th>
                                        <td className="py-4 px-6">At the scheduled date and time of the session.</td>
                                    </tr>
                                    <tr className="bg-gray-50/50">
                                        <th className="py-4 px-6 font-bold w-1/3 align-top">Returns & Cancellations</th>
                                        <td className="py-4 px-6 space-y-2">
                                            <p><strong>Customer Cancellations:</strong></p>
                                            <p>Full refund if cancelled more than 24 hours before the session.</p>
                                            <p>50% cancellation fee if cancelled within 24 hours.</p>
                                            <p><strong>Defective Services:</strong></p>
                                            <p>If the host fails to appear, a full refund will be issued. Please contact support.</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
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
