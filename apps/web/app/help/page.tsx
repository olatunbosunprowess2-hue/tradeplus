'use client';

import Link from 'next/link';

export default function HelpPage() {
    const faqs = [
        {
            question: 'How do I make a trade?',
            answer: 'Browse listings, find an item you want, and click "Make Offer" to propose a barter trade. You can offer your own items, cash, or a combination of both.'
        },
        {
            question: 'Is trading safe on BarterWave?',
            answer: 'Yes! We have identity verification, user ratings, and a trade confirmation system. Always meet in public places and verify items before completing the exchange.'
        },
        {
            question: 'What happens after my offer is accepted?',
            answer: 'You\'ll be able to chat with the seller to arrange the exchange. Both parties must confirm receipt within 24 hours to complete the trade.'
        },
        {
            question: 'How do I get verified?',
            answer: 'Go to Settings > Verification and submit your ID and a selfie. Verification helps build trust and unlocks additional features.'
        },
        {
            question: 'Can I use cash in trades?',
            answer: 'Yes! Listings can accept pure barter, cash + barter, or cash only. You can offer any combination when making an offer.'
        },
        {
            question: 'How do I report a problem?',
            answer: 'Go to the listing or user profile and tap the report button. Our team reviews all reports within 24 hours.'
        },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="container mx-auto px-4 py-6 max-w-2xl">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
                    <p className="text-gray-600">Find answers to common questions</p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <Link
                        href="/appeals"
                        className="bg-white rounded-2xl border border-gray-200 p-4 text-center hover:shadow-md transition"
                    >
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <p className="font-semibold text-gray-900">Report Issue</p>
                        <p className="text-xs text-gray-500">Submit a dispute</p>
                    </Link>
                    <a
                        href="mailto:support@barterwave.com"
                        className="bg-white rounded-2xl border border-gray-200 p-4 text-center hover:shadow-md transition"
                    >
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="font-semibold text-gray-900">Email Us</p>
                        <p className="text-xs text-gray-500">Get support</p>
                    </a>
                </div>

                {/* FAQs */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900">Frequently Asked Questions</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {faqs.map((faq, index) => (
                            <details key={index} className="group">
                                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-gray-50 transition">
                                    <p className="font-medium text-gray-900 pr-4">{faq.question}</p>
                                    <svg
                                        className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </summary>
                                <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">
                                    {faq.answer}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>

                {/* Contact Info */}
                <div className="mt-6 text-center text-gray-500 text-sm">
                    <p>Can't find what you're looking for?</p>
                    <a href="mailto:support@barterwave.com" className="text-blue-600 font-semibold hover:underline">
                        Contact our support team
                    </a>
                </div>
            </div>
        </div>
    );
}
