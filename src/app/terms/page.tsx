'use client'

import Link from 'next/link'
import { useTranslation, LanguageToggle } from '@/lib/i18n/translations'

export default function TermsPage() {
    const { t } = useTranslation()

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 py-4 flex justify-between items-center sticky top-0 z-50">
                <Link href="/" className="pl-logo text-xl">
                    POWER<span>LUNCH</span>.
                </Link>
                <LanguageToggle />
            </header>

            <div className="max-w-3xl mx-auto px-4 py-12">
                <h1 className="text-3xl font-black mb-2">Terms of Service</h1>
                <p className="text-gray-500 mb-8">Last updated: January 11, 2026</p>

                <div className="prose prose-gray max-w-none space-y-8">

                    {/* 1. Introduction */}
                    <section>
                        <h2 className="text-xl font-bold mb-4">1. Introduction and Acceptance</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Welcome to Power Lunch ("Platform", "we", "us", or "our"). By accessing or using our platform,
                            you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms,
                            please do not use our services.
                        </p>
                        <p className="text-gray-700 leading-relaxed mt-3">
                            Power Lunch operates as an <strong>intermediary platform</strong> that facilitates connections
                            between individuals seeking knowledge-sharing sessions ("Guests") and individuals offering
                            such sessions ("Hosts"). We do not employ Hosts, nor do we directly provide the sessions offered on our platform.
                        </p>
                    </section>

                    {/* 2. Platform Role */}
                    <section>
                        <h2 className="text-xl font-bold mb-4">2. Platform Role & Agency Disclaimer</h2>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                            <p className="text-gray-800 font-medium">
                                <i className="fa-solid fa-triangle-exclamation text-yellow-600 mr-2"></i>
                                Power Lunch acts solely as an <strong>agent and intermediary</strong> for appointment scheduling
                                and payment processing between independent parties.
                            </p>
                        </div>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li>We facilitate the discovery and booking of sessions between Hosts and Guests.</li>
                            <li>We process payments on behalf of Hosts through our payment processor (Stripe).</li>
                            <li>We do not control, endorse, or take responsibility for the quality, safety, legality, or
                                appropriateness of sessions offered by Hosts.</li>
                            <li>Hosts are independent contractors, not employees of Power Lunch.</li>
                            <li>Any agreement for services is directly between the Host and Guest.</li>
                        </ul>
                    </section>

                    {/* 3. User Responsibilities */}
                    <section>
                        <h2 className="text-xl font-bold mb-4">3. User Responsibilities</h2>

                        <h3 className="font-bold mt-4 mb-2">For All Users:</h3>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li>You must be at least 18 years old to use this platform.</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You agree to provide accurate, current, and complete information.</li>
                            <li>You will not use the platform for any illegal or unauthorized purpose.</li>
                        </ul>

                        <h3 className="font-bold mt-4 mb-2">For Hosts:</h3>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li>You are solely responsible for reporting and paying all applicable taxes on your earnings.</li>
                            <li>You represent that you have the legal right to offer your services.</li>
                            <li>You agree to honor all confirmed bookings or provide timely cancellation.</li>
                            <li>You are responsible for your own business compliance, licenses, and insurance.</li>
                            <li>You will not engage in discriminatory practices.</li>
                        </ul>

                        <h3 className="font-bold mt-4 mb-2">For Guests:</h3>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li>You agree to treat Hosts with respect and arrive on time for sessions.</li>
                            <li>You understand that session outcomes are not guaranteed.</li>
                            <li>You will not request services that violate laws or regulations.</li>
                        </ul>
                    </section>

                    {/* 4. Payments & Fees */}
                    <section>
                        <h2 className="text-xl font-bold mb-4">4. Payments, Fees, and Taxes</h2>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li>Power Lunch charges a <strong>15% service fee</strong> on each transaction, deducted from the Host's payout.</li>
                            <li>Payment processing is handled by Stripe. By using our platform, you agree to Stripe's terms of service.</li>
                            <li>Hosts receive payouts according to Stripe's standard payout schedule.</li>
                            <li><strong>Tax Responsibility:</strong> Hosts are solely responsible for determining, collecting,
                                reporting, and paying all applicable taxes. Power Lunch does not provide tax advice and is not
                                responsible for any Host's tax obligations.</li>
                            <li>We may provide transaction records to tax authorities as required by law.</li>
                        </ul>
                    </section>

                    {/* 5. Cancellation & Refunds */}
                    <section>
                        <h2 className="text-xl font-bold mb-4">5. Cancellation and Refund Policy</h2>
                        <ul className="list-disc pl-6 text-gray-700 space-y-2">
                            <li>Guests may cancel bookings up to 24 hours before the scheduled session for a full refund.</li>
                            <li>Cancellations within 24 hours may be subject to a 50% cancellation fee.</li>
                            <li>No-shows by Guests forfeit the full session fee.</li>
                            <li>If a Host cancels or fails to appear, Guests will receive a full refund.</li>
                            <li>Disputes must be reported within 48 hours of the scheduled session.</li>
                        </ul>
                    </section>

                    {/* 6. Limitation of Liability */}
                    <section>
                        <h2 className="text-xl font-bold mb-4">6. Limitation of Liability</h2>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <p className="text-gray-800">
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW, POWER LUNCH SHALL NOT BE LIABLE FOR ANY INDIRECT,
                                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
                            </p>
                            <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-1">
                                <li>Loss of profits, revenue, or business opportunities</li>
                                <li>Personal injury or property damage resulting from sessions</li>
                                <li>Content or conduct of any Host or Guest</li>
                                <li>Unauthorized access to user data</li>
                                <li>Service interruptions or technical failures</li>
                            </ul>
                            <p className="text-gray-800 mt-3">
                                Our total liability shall not exceed the amount of fees paid to us in the 12 months
                                preceding the claim.
                            </p>
                        </div>
                    </section>

                    {/* 7. Indemnification */}
                    <section>
                        <h2 className="text-xl font-bold mb-4">7. Indemnification</h2>
                        <p className="text-gray-700 leading-relaxed">
                            You agree to indemnify, defend, and hold harmless Power Lunch, its officers, directors, employees,
                            and agents from any claims, damages, losses, liabilities, and expenses (including legal fees)
                            arising out of or related to:
                        </p>
                        <ul className="list-disc pl-6 mt-3 text-gray-700 space-y-2">
                            <li>Your use of the platform</li>
                            <li>Your violation of these Terms</li>
                            <li>Your violation of any third-party rights</li>
                            <li>Any session you provide or participate in</li>
                            <li>Your tax obligations or failure to comply with tax laws</li>
                        </ul>
                    </section>

                    {/* 8. Dispute Resolution */}
                    <section>
                        <h2 className="text-xl font-bold mb-4">8. Dispute Resolution</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Any disputes arising from these Terms or your use of the platform shall first be attempted
                            to be resolved through good-faith negotiation. If unresolved, disputes shall be subject to
                            binding arbitration in accordance with the laws of Japan.
                        </p>
                        <p className="text-gray-700 leading-relaxed mt-3">
                            You agree to waive any right to participate in a class action lawsuit or class-wide arbitration.
                        </p>
                    </section>

                    {/* 9. Privacy */}
                    <section>
                        <h2 className="text-xl font-bold mb-4">9. Privacy</h2>
                        <p className="text-gray-700 leading-relaxed">
                            Your privacy is important to us. Please review our <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link> to
                            understand how we collect, use, and protect your personal information.
                        </p>
                    </section>

                    {/* 10. Modifications */}
                    <section>
                        <h2 className="text-xl font-bold mb-4">10. Modifications to Terms</h2>
                        <p className="text-gray-700 leading-relaxed">
                            We reserve the right to modify these Terms at any time. We will notify users of significant
                            changes via email or platform notification. Continued use of the platform after changes
                            constitutes acceptance of the modified Terms.
                        </p>
                    </section>

                    {/* 11. Contact */}
                    <section>
                        <h2 className="text-xl font-bold mb-4">11. Contact Information</h2>
                        <p className="text-gray-700 leading-relaxed">
                            For questions about these Terms, please contact us at:
                        </p>
                        <p className="text-gray-700 mt-2">
                            <strong>Email:</strong> legal@powerlunch.app<br />
                            <strong>Address:</strong> Sendai, Miyagi Prefecture, Japan
                        </p>
                    </section>

                </div>

                <div className="mt-12 pt-8 border-t border-gray-200 text-center">
                    <Link href="/" className="text-blue-600 hover:underline">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    )
}
