import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative">
                    <h1 className="text-9xl font-extrabold text-blue-500 opacity-20">404</h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white px-4">
                            <svg className="w-24 h-24 text-blue-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-gray-900">Oops! Page not found</h2>
                    <p className="text-gray-500">
                        The page you're looking for doesn't exist or has been moved.
                        Let's get you back on track.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/"
                        className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                    >
                        Go Home
                    </Link>
                    <Link
                        href="/listings"
                        className="w-full sm:w-auto px-8 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition"
                    >
                        Browse Listings
                    </Link>
                </div>

                <p className="text-sm text-gray-400 pt-8">
                    If you believe this is a mistake, please <Link href="/support" className="text-blue-500 hover:underline">contact support</Link>.
                </p>
            </div>
        </div>
    );
}
