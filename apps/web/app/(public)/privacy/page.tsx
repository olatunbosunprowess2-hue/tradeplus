export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

            <div className="prose dark:prose-invert">
                <h2>1. Introduction</h2>
                <p>Welcome to BarterWave. We respect your privacy and are committed to protecting your personal data.</p>

                <h2>2. Data We Collect</h2>
                <p>We may collect identifying information including but not limited to: Name, Email Address, Phone Number, and Transaction History.</p>

                <h2>3. How We Use Your Data</h2>
                <p>We use your data to facilitate transactions, improve our platform, and communicate with you about your account.</p>

                <h2>4. Data Sharing</h2>
                <p>We do not sell your data. We only share data with service providers necessary to operate the platform (e.g., payment processors).</p>

                <h2>5. Your Rights</h2>
                <p>You have the right to access, rectify, or delete your personal data. Contact us at support@barterwave.com for requests.</p>
            </div>
        </div>
    );
}
