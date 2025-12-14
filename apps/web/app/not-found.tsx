import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="text-center max-w-lg">
                <div className="text-9xl font-bold text-gray-200 mb-4">404</div>
                <div className="text-6xl mb-6">🔍</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
                <p className="text-gray-600 mb-8 leading-relaxed">
                    Sorry, we couldn't find the page you're looking for.
                    It might have been moved or doesn't exist.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/listings"
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
                    >
                        Browse Listings
                    </Link>
                    <Link
                        href="/"
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition"
                    >
                        Go Home
                    </Link>
                </div>

                <p className="mt-12 text-sm text-gray-500">
                    Need help?{' '}
                    <Link href="/contact" className="text-blue-600 hover:underline">
                        Contact support
                    </Link>
                </p>
            </div>
        </div>
    );
}
