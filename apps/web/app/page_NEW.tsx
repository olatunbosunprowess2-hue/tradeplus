'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

export default function LandingPage() {
    const [isVisible, setIsVisible] = useState(false);
    const [activeUsers, setActiveUsers] = useState(0);
    const [itemsListed, setItemsListed] = useState(0);
    const [satisfaction, setSatisfaction] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const statsRef = useRef<HTMLElement>(null);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Counting animation triggered by scroll
    useEffect(() => {
        const currentRef = statsRef.current;
        if (!currentRef || hasAnimated) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasAnimated) {
                    setHasAnimated(true);

                    const duration = 3000; // 3 seconds for smoother animation
                    const frameDuration = 1000 / 60; // 60 fps
                    const totalFrames = Math.round(duration / frameDuration);

                    let frame = 0;
                    const counter = setInterval(() => {
                        frame++;
                        const progress = frame / totalFrames;
                        const easeOutQuad = progress * (2 - progress); // Easing function

                        setActiveUsers(Math.round(easeOutQuad * 10000));
                        setItemsListed(Math.round(easeOutQuad * 50000));
                        setSatisfaction(Math.round(easeOutQuad * 95));

                        if (frame === totalFrames) {
                            clearInterval(counter);
                        }
                    }, frameDuration);
                }
            },
            { threshold: 0.3 } // Trigger when 30% of section is visible
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
                {/* Animated background shapes */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute top-60 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="container mx-auto px-4 py-20 relative z-10">
                    <div className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight animate-fade-in">
                            Buy, Sell & Trade
                            <span className="block text-yellow-300 mt-2 animate-bounce-gentle">Anything You Want</span>
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-blue-50 max-w-2xl mx-auto opacity-0 animate-fade-in-delay">
                            The revolutionary marketplace where you can pay with cash, barter items, or combine both. Your items, your rules.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 opacity-0 animate-fade-in-delay-2">
                            <Link
                                href="/register"
                                className="relative bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-2 hover:scale-105 active:scale-95 animate-pulse-gentle group"
                            >
                                <span className="relative z-10">Get Started Free</span>
                                {/* Animated pulsing ring */}
                                <span className="absolute inset-0 rounded-xl bg-white opacity-75 animate-ping-slow"></span>
                                {/* Glow effect */}
                                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-200 to-orange-200 opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-500"></span>
                            </Link>
                            <Link
                                href="/listings"
                                className="bg-blue-600/20 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-600/40 transition-all duration-300 border-2 border-white/30 hover:border-white/50 transform hover:-translate-y-2 hover:scale-105 active:scale-95"
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
                        <div className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 border border-green-100 hover:border-green-300 hover:-translate-y-2 cursor-pointer">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors duration-300">Pay with Cash</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Traditional buying and selling with secure payment options. Simple, fast, and reliable for everyday transactions.
                            </p>
                        </div>

                        {/* Barter */}
                        <div className="group bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 border border-purple-100 hover:border-purple-300 hover:-translate-y-2 cursor-pointer">
                            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors duration-300">Trade Items</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Exchange your items for others without spending money. The modern barter system for smart traders.
                            </p>
                        </div>

                        {/* Hybrid */}
                        <div className="group bg-gradient-to-br from-primary-pale to-cyan-50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 border border-blue-200 hover:border-blue-400 hover:-translate-y-2 cursor-pointer">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">Hybrid Deals</h3>
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
