export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-5xl">
            <h1 className="text-4xl font-extrabold mb-2 text-slate-900">Terms of Service</h1>
            <p className="text-slate-500 mb-8 pb-8 border-b border-slate-200">Last Updated: February 9, 2026</p>

            <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-slate-900 prose-p:text-slate-600 prose-li:text-slate-600">
                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
                    <p>
                        These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity (“you”) and BarterWave (“we,” “us” or “our”), concerning your access to and use of the BarterWave website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the “Site”).
                    </p>
                    <p className="mt-4">
                        By accessing the Site, you acknowledge that you have read, understood, and agreed to be bound by all of these Terms of Service. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS OF SERVICE, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SITE AND YOU MUST DISCONTINUE USE IMMEDIATELY.
                    </p>
                </section>

                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">2. Eligibility and User Accounts</h2>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong>Age Requirement:</strong> You must be at least 18 years of age to use the Site. By using the Site, you represent and warrant that you are at least 18 years old.</li>
                        <li><strong>Registration:</strong> You may be required to register with the Site. You agree to keep your password confidential and will be responsible for all use of your account and password.</li>
                        <li><strong>Account Accuracy:</strong> You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</li>
                    </ul>
                </section>

                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">3. Marketplace Operations</h2>
                    <h3 className="text-xl font-semibold mb-2">3.1 Listings</h3>
                    <p>
                        Users may post items for sale, trade, or barter ("Listings"). You represent and warrant that you have the legal right to sell or trade any item you list. BarterWave does not own or touch the physical goods listed on the platform.
                    </p>
                    <h3 className="text-xl font-semibold mt-6 mb-2">3.2 Barter Transactions</h3>
                    <p>
                        BarterWave facilitates "Barter" (trade) transactions. While we provide the platform for communication and escrow, users are responsible for evaluating the value and condition of traded goods.
                    </p>
                    <h3 className="text-xl font-semibold mt-6 mb-2">3.3 Escrow and Payments</h3>
                    <p>
                        Financial transactions on BarterWave are processed through secure payment gateways (e.g., Paystack). We provide an escrow service to ensure funds are held securely until the transaction is successfully completed or a dispute is resolved.
                    </p>
                </section>

                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">4. Prohibited Items and Conduct</h2>
                    <p>The following items are strictly prohibited from being listed on BarterWave:</p>
                    <ul className="list-disc pl-6 space-y-2 mt-4">
                        <li>Illegal drugs, narcotics, or drug paraphernalia.</li>
                        <li>Firearms, ammunition, or weapons of any kind.</li>
                        <li>Counterfeit goods or unauthorized replicas.</li>
                        <li>Explicit adult content or services.</li>
                        <li>Stolen property or items violating third-party intellectual property rights.</li>
                        <li>Endangered species or animal parts.</li>
                    </ul>
                </section>

                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">5. Fees and Subscription</h2>
                    <p>
                        BarterWave may charge fees for certain services, such as listing boosts, premium subscriptions, or transaction commissions. All fees are non-refundable unless otherwise stated. We reserve the right to change our fee structure at any time with prior notice.
                    </p>
                </section>

                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">6. Dispute Resolution</h2>
                    <p>
                        In the event of a dispute between a buyer and seller, users agree to use BarterWave's internal dispute resolution system. We reserve the right to mediate and make final decisions regarding escrow releases or refunds based on provided evidence.
                    </p>
                </section>

                <section className="mb-10 border-t border-slate-200 pt-10">
                    <h2 className="text-2xl font-bold mb-4">7. Limitation of Liability</h2>
                    <p className="italic">
                        BARTERWAVE IS PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. TO THE MAXIMUM EXTENT PERMITTED BY LAW, BARTERWAVE SHALL NOT BE LIABLE FOR ANY DAMAGES OF ANY KIND ARISING FROM THE USE OF THE SITE, INCLUDING BUT NOT LIMITED TO DIRECT, INDIRECT, INCIDENTAL, PUNITIVE, AND CONSEQUENTIAL DAMAGES.
                    </p>
                </section>

                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">8. Governing Law</h2>
                    <p>
                        These Terms shall be governed by and defined following the laws of Nigeria, without regard to its conflict of law principles. BarterWave and yourself irrevocably consent that the courts of Nigeria shall have exclusive jurisdiction to resolve any dispute which may arise in connection with these terms.
                    </p>
                </section>

                <section className="mb-10">
                    <h2 className="text-2xl font-bold mb-4">9. Contact Us</h2>
                    <p>
                        In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at:
                    </p>
                    <p className="font-semibold mt-2">
                        BarterWave Global Support<br />
                        Email: legal@barterwave.com
                    </p>
                </section>
            </div>
        </div>
    );
}
