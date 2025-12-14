import Link from 'next/link';

export const metadata = {
    title: 'Privacy Policy | BarterWave',
    description: 'How BarterWave collects, uses, and protects your personal information',
};

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
                    <p className="text-gray-500 mb-8">Last updated: December 2024</p>

                    <div className="prose prose-gray max-w-none space-y-8">
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We collect information you provide directly and automatically when you use BarterWave:
                            </p>

                            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Information You Provide</h3>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>Account information (name, email, phone number)</li>
                                <li>Profile information (display name, bio, avatar)</li>
                                <li>Listing content (titles, descriptions, images, prices)</li>
                                <li>Verification documents (ID photos for identity verification)</li>
                                <li>Messages exchanged with other users</li>
                                <li>Payment information (processed securely by payment providers)</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">Automatically Collected</h3>
                            <ul className="list-disc pl-6 text-gray-600 space-y-2">
                                <li>Device information (browser type, operating system)</li>
                                <li>IP address and approximate location</li>
                                <li>Usage data (pages viewed, features used)</li>
                                <li>Cookies and similar technologies</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We use the collected information to:
                            </p>
                            <ul className="list-disc pl-6 mt-3 text-gray-600 space-y-2">
                                <li>Provide, maintain, and improve our services</li>
                                <li>Process transactions and send related notifications</li>
                                <li>Verify user identity and prevent fraud</li>
                                <li>Facilitate communication between buyers and sellers</li>
                                <li>Send service updates and promotional communications</li>
                                <li>Respond to support requests and resolve disputes</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We may share your information with:
                            </p>
                            <ul className="list-disc pl-6 mt-3 text-gray-600 space-y-2">
                                <li><strong>Other Users:</strong> Your public profile, listings, and reviews are visible to other users</li>
                                <li><strong>Service Providers:</strong> Third parties who help us operate (payment processors, hosting, analytics)</li>
                                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                            </ul>
                            <p className="text-gray-600 leading-relaxed mt-4">
                                We do <strong>not</strong> sell your personal information to third parties for advertising purposes.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">4. Data Security</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We implement industry-standard security measures to protect your data:
                            </p>
                            <ul className="list-disc pl-6 mt-3 text-gray-600 space-y-2">
                                <li>Encryption of data in transit and at rest</li>
                                <li>Secure password hashing</li>
                                <li>Regular security audits and monitoring</li>
                                <li>Limited employee access to personal data</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">5. Your Rights and Choices</h2>
                            <p className="text-gray-600 leading-relaxed">
                                You have the right to:
                            </p>
                            <ul className="list-disc pl-6 mt-3 text-gray-600 space-y-2">
                                <li>Access and download your personal data</li>
                                <li>Correct inaccurate information</li>
                                <li>Delete your account and associated data</li>
                                <li>Opt out of promotional emails</li>
                                <li>Control cookie preferences</li>
                            </ul>
                            <p className="text-gray-600 leading-relaxed mt-4">
                                To exercise these rights, contact us at{' '}
                                <a href="mailto:privacy@barterwave.com" className="text-blue-600 hover:underline">
                                    privacy@barterwave.com
                                </a>
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We retain your information for as long as your account is active or as needed to provide services.
                                After account deletion, we may retain certain data for legal, security, or business purposes
                                for up to 3 years.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">7. Cookies and Tracking</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We use cookies and similar technologies to:
                            </p>
                            <ul className="list-disc pl-6 mt-3 text-gray-600 space-y-2">
                                <li>Keep you logged in</li>
                                <li>Remember your preferences</li>
                                <li>Understand how you use our platform</li>
                                <li>Improve our services</li>
                            </ul>
                            <p className="text-gray-600 leading-relaxed mt-4">
                                You can control cookies through your browser settings. Disabling cookies may limit some features.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
                            <p className="text-gray-600 leading-relaxed">
                                BarterWave is not intended for users under 18 years of age. We do not knowingly collect
                                personal information from children. If we learn we have collected data from a child,
                                we will delete it promptly.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
                            <p className="text-gray-600 leading-relaxed">
                                Your information may be transferred to and processed in countries other than your own.
                                We ensure appropriate safeguards are in place for such transfers.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We may update this Privacy Policy from time to time. We will notify you of significant
                                changes through email or a notice on our platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
                            <p className="text-gray-600 leading-relaxed">
                                For privacy-related questions or concerns, contact us at:{' '}
                                <a href="mailto:privacy@barterwave.com" className="text-blue-600 hover:underline">
                                    privacy@barterwave.com
                                </a>
                            </p>
                        </section>
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200">
                        <Link
                            href="/terms"
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Read our Terms of Service →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
