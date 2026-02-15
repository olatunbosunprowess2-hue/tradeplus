'use client';

// BarterWave Application Entry Point

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

          const duration = 2500;
          const frameDuration = 1000 / 60;
          const totalFrames = Math.round(duration / frameDuration);

          let frame = 0;
          const counter = setInterval(() => {
            frame++;
            const progress = frame / totalFrames;
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);

            setActiveUsers(Math.round(easeOutQuart * 10000));
            setItemsListed(Math.round(easeOutQuart * 50000));
            setSatisfaction(Math.round(easeOutQuart * 95));

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
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero Section with Mesh Gradient */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Mesh Gradient Background */}
        <div className="absolute inset-0 mesh-gradient" />

        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large floating circle */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-float-delayed" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl animate-float-slow" />

          {/* Small decorative elements */}
          <div className="absolute top-20 right-1/4 w-3 h-3 bg-white/30 rounded-full animate-float" />
          <div className="absolute top-1/3 left-1/5 w-2 h-2 bg-white/20 rounded-full animate-float-delayed" />
          <div className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-purple-300/30 rounded-full animate-float-slow" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />

        {/* Content */}
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Logo Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-fade-in">
              <img
                src="/logo-transparent.png"
                alt="BarterWave"
                className="w-8 h-8 object-contain"
              />
              <span className="text-white/90 text-sm font-medium">The Future of Trading is Here</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-hero text-white mb-6 animate-slide-up font-display">
              Buy, Sell & Trade
              <span className="block mt-2 gradient-text-hero">
                Anything You Want
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/80 mb-10 max-w-3xl mx-auto animate-slide-up delay-200 leading-relaxed">
              The revolutionary marketplace where you can pay with cash,
              barter items, or combine both. <span className="text-white font-semibold">Your items, your rules.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up delay-300">
              <Link
                href="/register"
                className="group relative inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-white/25"
              >
                <span>Get Started Free</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/listings"
                className="group inline-flex items-center justify-center gap-2 glass text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-white/20"
              >
                <span>Browse Marketplace</span>
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap justify-center gap-8 animate-fade-in delay-500">
              <div className="flex items-center gap-2 text-white/70">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">100% Free to Join</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Verified Users</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">Secure Transactions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Features Section - Four Ways to Trade */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'url(/community-walking.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-white" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-10">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-4 border border-blue-100 uppercase tracking-wider">
              How It Works
            </span>
            <h2 className="text-3xl md:text-h1 text-gray-900 mb-3 font-display">
              Four Ways to <span className="gradient-text">Trade</span>
            </h2>
            <p className="text-base md:text-lg text-gray-500 max-w-lg mx-auto font-medium">
              BarterWave gives you the flexibility to trade your way
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
            {/* Cash Card */}
            <div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:border-emerald-200 transition-all duration-300">
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30 group-hover:rotate-6 transition-transform">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm3-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5 font-display tracking-tight">Pay Cash</h3>
                <p className="text-gray-500 text-[11px] md:text-xs leading-relaxed font-medium">
                  Direct buy/sell with secure payments.
                </p>
              </div>
            </div>

            {/* Barter Card */}
            <div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:border-purple-200 transition-all duration-300">
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30 group-hover:rotate-6 transition-transform">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5 font-display tracking-tight">Barter Items</h3>
                <p className="text-gray-500 text-[11px] md:text-xs leading-relaxed font-medium">
                  Swap items value-for-value instantly.
                </p>
              </div>
            </div>

            {/* Hybrid Card */}
            <div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:border-blue-200 transition-all duration-300">
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30 group-hover:rotate-6 transition-transform">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5 font-display tracking-tight">Hybrid Deals</h3>
                <p className="text-gray-500 text-[11px] md:text-xs leading-relaxed font-medium">
                  Combine cash and items for trade.
                </p>
              </div>
            </div>

            {/* Community Card */}
            <div className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:border-orange-200 transition-all duration-300">
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-400 to-rose-500 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/30 group-hover:rotate-6 transition-transform">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5 font-display tracking-tight">Community</h3>
                <p className="text-gray-500 text-[11px] md:text-xs leading-relaxed font-medium">
                  Collaborate in exclusive feeds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section - NEW */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-blue-600/10 rounded-3xl transform rotate-3 scale-105" />
              <img
                src="/community-connection.png"
                alt="Community Collaboration"
                className="relative rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]"
              />
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-xl animate-float-delayed">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-600">JD</div>
                    <div className="w-10 h-10 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs font-bold text-purple-600">AS</div>
                    <div className="w-10 h-10 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-xs font-bold text-green-600">+2k</div>
                  </div>
                  <div className="text-sm font-bold text-gray-900">
                    Active Traders
                    <span className="block text-xs font-normal text-gray-500">Online now</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2">
              <span className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-6">
                Community Driven
              </span>
              <h2 className="text-h2 text-gray-900 mb-6 font-display">
                Trading is Better <span className="gradient-text">Together</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Unlock opportunities you won't find on the feed. Join discussions, find trading partners, and discover the power of community collaboration.
              </p>

              <div className="space-y-6 mb-10">
                {[
                  { title: 'Community Feed', desc: 'Share tips, ask questions, and showcase your best finds.' },
                  { title: 'Direct Collaboration', desc: 'Connect with serious traders for bulk deals and partnerships.' },
                  { title: 'Unlock Trades', desc: 'Find specific items you need by posting requests to the community.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/listings?tab=community"
                className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-gray-800 hover:scale-105 shadow-lg"
              >
                <span>Join the Discussion</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-3 gap-4 md:gap-8">
              {/* Active Users */}
              <div className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-1">
                  {activeUsers.toLocaleString()}+
                </div>
                <p className="text-gray-500 text-xs md:text-sm font-medium">Active Users</p>
              </div>

              {/* Items Listed */}
              <div className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-1">
                  {itemsListed.toLocaleString()}+
                </div>
                <p className="text-gray-500 text-xs md:text-sm font-medium">Items Listed</p>
              </div>

              {/* Satisfaction */}
              <div className="text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-2xl md:text-4xl font-bold text-gray-900 mb-1">
                  {satisfaction}%
                </div>
                <p className="text-gray-500 text-xs md:text-sm font-medium">Satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section - Sleek Minimalist Design */}
      <section className="py-24 relative overflow-hidden bg-gray-900">
        {/* Full Opacity High-Res Background Image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url(/community-walking.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        {/* Professional Dark Overlay for High Contrast */}
        <div className="absolute inset-0 bg-gray-900/50 z-[1]" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-sm font-semibold mb-4 border border-white/20 shadow-lg">
              Why Choose Us
            </span>
            <h2 className="text-h1 text-white mb-4 font-display drop-shadow-xl">
              Built for <span className="text-blue-400">Your Safety</span>
            </h2>
            <p className="text-xl text-gray-100 max-w-2xl mx-auto font-medium drop-shadow-md">
              We prioritize your safety and convenience above everything else
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-6xl mx-auto">
            {[
              { icon: '🔒', title: 'Secure Transactions', desc: 'End-to-end encrypted payments' },
              { icon: '⚡', title: 'Lightning Fast', desc: 'List and trade in seconds' },
              { icon: '✅', title: 'Verified Users', desc: 'Identity verification required' },
              { icon: '🎧', title: '24/7 Support', desc: 'Always here to help you' },
            ].map((feature, i) => (
              <div key={i} className="group text-center transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-4xl md:text-5xl mb-6 drop-shadow-2xl group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h4 className="font-bold text-white mb-2 font-display text-lg drop-shadow-lg">{feature.title}</h4>
                <p className="text-gray-200 text-xs md:text-sm leading-relaxed font-medium drop-shadow-md">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 mesh-gradient" />
        <div className="absolute inset-0 bg-black/20" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-h1 text-white mb-6 font-display">
            Ready to Start Trading?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Join thousands of users buying, selling, and bartering. Create your free account in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl"
            >
              <span>Sign Up Now - It's Free</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 glass text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 hover:bg-white/20"
            >
              Already Have Account?
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          {/* Mobile: horizontal 2x2 grid, Desktop: 4 columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-10">
            {/* Brand - full width on mobile */}
            <div className="col-span-2 md:col-span-1 mb-4 md:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <span className="text-white font-bold text-lg">BarterWave</span>
              </div>
              <p className="text-xs leading-relaxed text-gray-500">
                Africa's trusted marketplace for buying, selling, and trading goods.
              </p>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/listings" className="hover:text-white transition">Marketplace</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Support</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/help" className="hover:text-white transition">Help Center</Link></li>
                <li><Link href="/verification" className="hover:text-white transition">Get Verified</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact Us</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col-reverse md:flex-row justify-between items-center gap-4">
            <p className="text-xs">© 2024 BarterWave. All rights reserved.</p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" /></svg>
              </a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
