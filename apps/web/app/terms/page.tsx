import Link from 'next/link';

export const metadata = {
    title: 'Terms of Service | BarterWave',
    description: 'Terms and conditions for using BarterWave marketplace',
};

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
                    <p className="text-gray-500 mb-8">Last updated: December 2024</p>

                    <div className="prose prose-gray max-w-none space-y-8">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                            <p className="text-gray-600 leading-relaxed">
                                By accessing or using BarterWave ("the Platform"), you agree to be bound by these Terms of Service.
                                If you do not agree to these terms, please do not use our services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                            <p className="text-gray-600 leading-relaxed">
                                BarterWave is an online marketplace that enables users to buy, sell, and trade goods and services.
                                We provide a platform for transactions but are not a party to any transaction between users.
                            </p>
                            <ul className="list-disc pl-6 mt-3 text-gray-600 space-y-2">
                                <li>Listing and browsing of items for sale or trade</li>
                                <li>Communication between buyers and sellers</li>
                                <li>Escrow protection for distress sales</li>
                                <li>Identity verification services</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                            <p className="text-gray-600 leading-relaxed">
                                To use certain features, you must create an account. You are responsible for:
                            </p>
                            <ul className="list-disc pl-6 mt-3 text-gray-600 space-y-2">
                                <li>Providing accurate and complete information</li>
                                <li>Maintaining the security of your account credentials</li>
                                <li>All activities that occur under your account</li>
                                <li>Notifying us immediately of any unauthorized use</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Listing and Transactions</h2>
                            <p className="text-gray-600 leading-relaxed">
                                When listing items or services, you agree to:
                            </p>
                            <ul className="list-disc pl-6 mt-3 text-gray-600 space-y-2">
                                <li>Provide accurate descriptions and images</li>
                                <li>Have legal right to sell or trade the items</li>
                                <li>Honor agreed-upon terms with buyers</li>
                                <li>Not list prohibited or illegal items</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Escrow Protection</h2>
                            <p className="text-gray-600 leading-relaxed">
                                For distress sales, we offer escrow protection. The buyer's payment is held securely until they
                                confirm receipt of the item. A protection fee (1-1.5%) applies to cover transaction security.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Prohibited Activities</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Users may not:
                            </p>
                            <ul className="list-disc pl-6 mt-3 text-gray-600 space-y-2">
                                <li>Post false, misleading, or fraudulent listings</li>
                                <li>Harass, threaten, or abuse other users</li>
                                <li>Attempt to circumvent platform fees or protections</li>
                                <li>Use the platform for illegal activities</li>
                                <li>Create multiple accounts to evade bans</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Fees and Payments</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Listing on BarterWave is free. For escrow-protected transactions, applicable fees include:
                            </p>
                            <ul className="list-disc pl-6 mt-3 text-gray-600 space-y-2">
                                <li>Buyer protection fee: 1-1.5% (minimum ₦500)</li>
                                <li>Seller commission: 4-5% (deducted upon release)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
                            <p className="text-gray-600 leading-relaxed">
                                BarterWave acts as a platform connecting buyers and sellers. We are not responsible for:
                            </p>
                            <ul className="list-disc pl-6 mt-3 text-gray-600 space-y-2">
                                <li>The quality, safety, or legality of listed items</li>
                                <li>The ability of sellers to sell or buyers to pay</li>
                                <li>Disputes between users (though we may assist in resolution)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">9. Termination</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We reserve the right to suspend or terminate accounts that violate these terms,
                                engage in fraudulent activity, or pose a risk to our community.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We may update these terms from time to time. Continued use of the platform after changes
                                constitutes acceptance of the new terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
                            <p className="text-gray-600 leading-relaxed">
                                If you have questions about these Terms of Service, please contact us at{' '}
                                <a href="mailto:support@barterwave.com" className="text-blue-600 hover:underline">
                                    support@barterwave.com
                                </a>
                            </p>
                        </section>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <Link
                            href="/privacy"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Read our Privacy Policy →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
