export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <h1 className="text-4xl font-extrabold mb-2 text-slate-900">Privacy Policy</h1>
            <p className="text-slate-500 mb-8 pb-8 border-b border-slate-200">Last Updated: February 9, 2026</p>

            <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                    <p>
                        This Privacy Policy describes how BarterWave ("we," "us," or "our") collects, uses, and shares your personal information when you use our website or mobile application (the "Service"). We are committed to protecting your personal data and your right to privacy in accordance with data protection regulations, including the Nigeria Data Protection Regulation (NDPR) and the General Data Protection Regulation (GDPR) where applicable.
                    </p>
                </section>

                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
                    <h3 className="text-xl font-semibold mb-2">2.1 Personal Data You Provide</h3>
                    <p>We collect personal information that you voluntarily provide to us when you register on the Service, express an interest in obtaining information about us or our products and services, or otherwise contact us. This may include:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-4 text-slate-600">
                        <li>Name and Contact Data (Email address, phone number, physical address).</li>
                        <li>Identity Verification Information (Identification documents for "Verified User" status).</li>
                        <li>Payment Information (Last 4 digits of cards, billing address – full payment details are processed by our payment provider, Paystack).</li>
                        <li>Profile Information (Bio, profile photo, preferred categories).</li>
                    </ul>

                    <h3 className="text-xl font-semibold mt-6 mb-2">2.2 Information Automatically Collected</h3>
                    <p>We automatically collect certain information when you visit, use, or navigate the Service. This information does not reveal your specific identity but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, and other technical information.</p>
                </section>

                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
                    <p>We use personal information collected via our Service for a variety of business purposes, including:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-4">
                        <li>To facilitate account creation and the logon process.</li>
                        <li>To protect our Services and prevent fraud (KYC/AML compliance).</li>
                        <li>To enable user-to-user communication for bartering and sales.</li>
                        <li>To process transactions and manage the escrow system.</li>
                        <li>To send administrative information and marketing communications.</li>
                        <li>To comply with legal obligations and respond to legal requests.</li>
                    </ul>
                </section>

                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">4. Sharing Your Information</h2>
                    <p>We may process or share your data that we hold based on the following legal basis:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-4">
                        <li><strong>Consent:</strong> We may process your data if you have given us specific consent to use your personal information for a specific purpose.</li>
                        <li><strong>Performance of a Contract:</strong> Where we have entered into a contract with you, we may process your personal information to fulfill the terms of our contract.</li>
                        <li><strong>Service Providers:</strong> We may share your information with third-party vendors, service providers, contractors or agents who perform services for us or on our behalf (e.g., Paystack for payments, Cloudinary for image hosting).</li>
                        <li><strong>Business Transfers:</strong> We may share or transfer your information in connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company.</li>
                    </ul>
                </section>

                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">5. Data Retention</h2>
                    <p>
                        We will only keep your personal information for as long as it is necessary for the purposes set out in this privacy policy, unless a longer retention period is required or permitted by law (such as tax, accounting or other legal requirements).
                    </p>
                </section>

                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">6. Your Privacy Rights</h2>
                    <p>
                        In some regions (like the EEA and UK), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability.
                    </p>
                    <p className="mt-4">
                        To make such a request, please use the contact details provided below. We will consider and act upon any request in accordance with applicable data protection laws.
                    </p>
                </section>

                <section className="mb-10 border-t border-slate-200 pt-10">
                    <h2 className="text-2xl font-bold mb-4">7. Security of Your Information</h2>
                    <p>
                        We have implemented appropriate technical and organizational security measures designed to protect the security of any personal information we process. However, please also remember that we cannot guarantee that the internet itself is 100% secure.
                    </p>
                </section>

                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">8. Contact Us</h2>
                    <p>
                        If you have questions or comments about this policy, you may email us at:
                    </p>
                    <p className="font-semibold mt-2">
                        BarterWave Data Protection Officer<br />
                        Email: privacy@barterwave.com
                    </p>
                </section>
            </div>
        </div>
    );
}
