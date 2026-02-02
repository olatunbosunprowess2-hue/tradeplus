export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
            <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

            <div className="prose dark:prose-invert">
                <h2>1. Acceptance of Terms</h2>
                <p>By accessing BarterWave, you agree to be bound by these Terms of Service.</p>

                <h2>2. User Accounts</h2>
                <p>You are responsible for maintaining the security of your account credentials. You must be 18+ to use this service.</p>

                <h2>3. Prohibited Conduct</h2>
                <p>You agree not to engage in fraudulent activity, harassment, or the sale of illegal items.</p>

                <h2>4. Dispute Resolution</h2>
                <p>We encourage users to resolve disputes amicably. BarterWave reserves the right to make final decisions on platform disputes.</p>

                <h2>5. Liability</h2>
                <p>BarterWave is provided "as is". We are not liable for the actions of users on the platform.</p>
            </div>
        </div>
    );
}
