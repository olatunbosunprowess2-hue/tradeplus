'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

export default function LandingPage() {
  const [activeUsers, setActiveUsers] = useState(0);
  const [itemsListed, setItemsListed] = useState(0);
  const [satisfaction, setSatisfaction] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const statsRef = useRef<HTMLElement>(null);

  // Counting animation triggered by scroll
  useEffect(() => {
    const currentRef = statsRef.current;
    if (!currentRef || hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const duration = 3000; // 3 seconds
          const frameDuration = 1000 / 60;
          const totalFrames = Math.round(duration / frameDuration);

          let frame = 0;
          const counter = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const easeOutQuad = progress * (2 - progress);

            setActiveUsers(Math.round(easeOutQuad * 10000));
            setItemsListed(Math.round(easeOutQuad * 50000));
            setSatisfaction(Math.round(easeOutQuad * 95));

            if (frame === totalFrames) {
              clearInterval(counter);
            }
          }, frameDuration);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, [hasAnimated]);
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary-dark to-purple-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              Buy, Sell & Trade
              <span className="block text-yellow-300 mt-2">Anything You Want</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-50 max-w-2xl mx-auto">
              The revolutionary marketplace where you can pay with cash, barter items, or combine both. Your items, your rules.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
              >
                Get Started Free
              </Link>
              <Link
                href="/listings"
                className="bg-blue-600/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-600/30 transition border-2 border-white/30"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">How TradePlus Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Three flexible ways to trade - choose what works best for you</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Cash */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 hover:shadow-xl transition border border-green-100">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Pay with Cash</h3>
              <p className="text-gray-600 leading-relaxed">
                Traditional buying and selling with secure payment options. Simple, fast, and reliable for everyday transactions.
              </p>
            </div>

            {/* Barter */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 hover:shadow-xl transition border border-purple-100">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Trade Items</h3>
              <p className="text-gray-600 leading-relaxed">
                Exchange your items for others without spending money. The modern barter system for smart traders.
              </p>
            </div>

            {/* Hybrid */}
            <div className="bg-gradient-to-br from-primary-pale to-cyan-50 rounded-2xl p-8 hover:shadow-xl transition border border-blue-200">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Hybrid Deals</h3>
              <p className="text-gray-600 leading-relaxed">
                Combine cash and items for ultimate flexibility. Get creative with your trades and maximize value!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 bg-gradient-to-br from-gray-50 to-primary-pale">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div className="group hover:scale-110 transition-transform duration-300">
              <div className="text-5xl font-bold text-blue-600 mb-2 group-hover:animate-pulse">
                {activeUsers.toLocaleString()}+
              </div>
              <p className="text-gray-600 text-lg">Active Users</p>
            </div>
            <div className="group hover:scale-110 transition-transform duration-300">
              <div className="text-5xl font-bold text-blue-600 mb-2 group-hover:animate-pulse">
                {itemsListed.toLocaleString()}+
              </div>
              <p className="text-gray-600 text-lg">Items Listed</p>
            </div>
            <div className="group hover:scale-110 transition-transform duration-300">
              <div className="text-5xl font-bold text-blue-600 mb-2 group-hover:animate-pulse">
                {satisfaction}%
              </div>
              <p className="text-gray-600 text-lg">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Why Choose TradePlus?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Built with your safety and convenience in mind</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Secure Transactions</h4>
              <p className="text-gray-600 text-sm">Protected payments and verified users</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Lightning Fast</h4>
              <p className="text-gray-600 text-sm">List items in seconds, trade instantly</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">Easy to Use</h4>
              <p className="text-gray-600 text-sm">Intuitive interface for everyone</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">24/7 Support</h4>
              <p className="text-gray-600 text-sm">Always here to help you</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-blue-50 mb-10 max-w-2xl mx-auto">
            Join thousands of users buying, selling, and bartering. Create your free account in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-blue-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition shadow-2xl inline-block"
            >
              Sign Up Now - It's Free
            </Link>
            <Link
              href="/login"
              className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-600-light transition border-2 border-white inline-block"
            >
              Already Have Account?
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h3 className="text-white font-bold text-lg mb-4">TradePlus</h3>
            <p className="text-sm max-w-md">The modern marketplace for buying, selling, and trading.</p>
          </div>
          <div className="grid grid-cols-3 gap-4 sm:gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Safety</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 TradePlus. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
