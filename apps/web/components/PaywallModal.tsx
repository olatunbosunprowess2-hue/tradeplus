'use client';

import { useState } from 'react';
import { X, Check, Zap, Star, Crown, Bell, MapPin, TrendingUp, Sparkles, ShieldCheck, Target, BadgeCheck, Users, ArrowUpRight } from 'lucide-react';

interface PaywallOption {
    id: string;
    title: string;
    description: string;
    prices: { NGN: number; USD: number };
    originalPrices?: { NGN: number; USD: number };
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
    isPrimary?: boolean;
    quickFeatures?: string[];
    detailedBenefits?: string[];
}

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    options: PaywallOption[];
    onSelectOption: (optionId: string, currency: 'NGN' | 'USD') => void;
    showPremiumUpsell?: boolean;
    isLoading?: boolean;
    headerGradient?: string;
    creditsAvailable?: number;
    onUseCredit?: (optionId: string) => void;
}

export default function PaywallModal({
    isOpen,
    onClose,
    title,
    subtitle,
    options,
    onSelectOption,
    showPremiumUpsell = true,
    isLoading = false,
    headerGradient = 'from-slate-900 to-slate-800',
    creditsAvailable = 0,
    onUseCredit,
}: PaywallModalProps) {
    const [expandedOption, setExpandedOption] = useState<string | null>(null);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');

    if (!isOpen) return null;

    const handleSelect = (optionId: string) => {
        setSelectedOption(optionId);
        onSelectOption(optionId, currency);
    };

    const toggleExpand = (e: React.MouseEvent, optionId: string) => {
        e.stopPropagation();
        setExpandedOption(expandedOption === optionId ? null : optionId);
    };

    const formatPrice = (price: number, curr: 'NGN' | 'USD') => {
        if (curr === 'NGN') return `₦${price.toLocaleString()}`;
        return `$${(price / 100).toFixed(2)}`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-5xl my-auto animate-in fade-in zoom-in-95 duration-500 relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-20"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-white mb-3 tracking-tight drop-shadow-lg flex items-center justify-center gap-3">
                        <Sparkles className="text-amber-400 w-8 h-8" />
                        {title}
                        <Sparkles className="text-amber-400 w-8 h-8" />
                    </h2>
                    {subtitle && (
                        <p className="text-slate-300 text-lg max-w-2xl mx-auto font-medium">
                            {subtitle}
                        </p>
                    )}

                    {/* Currency Toggle */}
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <div className="bg-slate-900/80 p-1.5 rounded-full border border-slate-700/50 flex">
                            <button
                                onClick={() => setCurrency('NGN')}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide transition-all ${currency === 'NGN' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                🇳🇬 NGN
                            </button>
                            <button
                                onClick={() => setCurrency('USD')}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide transition-all ${currency === 'USD' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                🇺🇸 USD
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pricing Cards Grid */}
                <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 px-4">
                    {options.map((option) => {
                        const isSelected = selectedOption === option.id;
                        // For the 3-card layout mockup, we emphasize primary or selected
                        const isFeatured = option.isPrimary || (selectedOption === null && option.isPrimary);

                        return (
                            <div
                                key={option.id}
                                onClick={() => handleSelect(option.id)}
                                className={`relative flex flex-col rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden
                                    ${isSelected || isFeatured
                                        ? 'bg-slate-900 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)] md:-translate-y-4 md:scale-105 z-10'
                                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80 opacity-90'
                                    }
                                    ${options.length === 1 ? 'w-full max-w-md mx-auto' : 'flex-1 min-w-[280px] max-w-[340px]'}
                                `}
                            >
                                {/* Featured Glow */}
                                {(isSelected || isFeatured) && (
                                    <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
                                )}

                                {/* Card Header */}
                                <div className={`p-8 pb-6 text-center border-b ${isSelected || isFeatured ? 'border-slate-800/80' : 'border-slate-800/30'}`}>
                                    {option.badge && (
                                        <div className="mb-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${option.badgeColor || 'bg-blue-600'}`}>
                                                {option.badge}
                                            </span>
                                        </div>
                                    )}

                                    <h3 className={`text-xl font-bold mb-2 ${isSelected || isFeatured ? 'text-white' : 'text-slate-300'}`}>
                                        {option.title}
                                    </h3>

                                    <div className="flex flex-col items-center justify-center my-4">
                                        {option.originalPrices && (
                                            <span className="text-sm text-slate-500 line-through font-bold mb-1">
                                                {formatPrice(option.originalPrices[currency], currency)}
                                            </span>
                                        )}
                                        <div className="flex items-end gap-1 justify-center">
                                            <span className="text-4xl font-black text-white tracking-tight">
                                                {formatPrice(option.prices[currency], currency)}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-sm font-medium text-slate-400 leading-relaxed px-2">
                                        {option.description}
                                    </p>
                                </div>

                                {/* Features List */}
                                <div className="p-8 pt-6 flex-1 flex flex-col">
                                    <ul className="space-y-4 mb-8 flex-1">
                                        {option.quickFeatures?.map((f, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-300">
                                                <Check className={`w-5 h-5 shrink-0 ${isSelected || isFeatured ? 'text-blue-500' : 'text-slate-500'}`} />
                                                <span>{f}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Action Button */}
                                    <button
                                        disabled={isLoading}
                                        className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all ${isLoading && selectedOption === option.id
                                                ? 'bg-blue-600/50 text-white cursor-wait relative overflow-hidden'
                                                : isSelected || isFeatured
                                                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                                                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                                            }`}
                                    >
                                        {isLoading && selectedOption === option.id ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            'Get Started'
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Premium Upsell Card (If applicable) */}
                    {showPremiumUpsell && (
                        <div
                            onClick={() => handleSelect('premium')}
                            className={`relative flex flex-col rounded-[2rem] border transition-all duration-300 cursor-pointer overflow-hidden flex-1 min-w-[280px] max-w-[340px]
                                ${selectedOption === 'premium'
                                    ? 'bg-slate-900 border-amber-500 shadow-[0_0_40px_rgba(245,158,11,0.2)] md:-translate-y-4 md:scale-105 z-10'
                                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-600 hover:bg-slate-800/80 opacity-90'
                                }
                            `}
                        >
                            {/* Premium Glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10" />

                            {selectedOption === 'premium' && (
                                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_20px_rgba(245,158,11,0.5)]" />
                            )}

                            <div className="p-8 pb-6 text-center border-b border-slate-800/30 relative z-10">
                                <div className="mb-4">
                                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-900 bg-amber-400">
                                        Best Value
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold mb-2 text-white flex items-center justify-center gap-2">
                                    <Crown className="w-5 h-5 text-amber-500" />
                                    Empire Status
                                </h3>

                                <div className="flex flex-col items-center justify-center my-4">
                                    <span className="text-sm text-slate-500 line-through font-bold mb-1">
                                        {currency === 'NGN' ? '₦7,000' : '$14.99'}
                                    </span>
                                    <div className="flex items-end gap-1 justify-center">
                                        <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-200 to-amber-500 tracking-tight">
                                            {formatPrice(currency === 'NGN' ? 2500 : 499, currency)}
                                        </span>
                                        <span className="text-slate-500 font-bold mb-1">/mo</span>
                                    </div>
                                </div>

                                <p className="text-sm font-medium text-slate-400 leading-relaxed px-2">
                                    Unlimited privileges. Close deals faster.
                                </p>
                            </div>

                            <div className="p-8 pt-6 flex-1 flex flex-col relative z-10">
                                <ul className="space-y-4 mb-8 flex-1">
                                    {[
                                        "Unlimited Listings",
                                        "Unlimited Chats",
                                        "Verified Crown Badge",
                                        "Search Priority",
                                        "50% Off Boosts",
                                        "Read Receipts"
                                    ].map((f, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-300">
                                            <Check className={`w-5 h-5 flex-shrink-0 ${selectedOption === 'premium' ? 'text-amber-500' : 'text-slate-500'}`} />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    disabled={isLoading}
                                    className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all ${isLoading && selectedOption === 'premium'
                                            ? 'bg-amber-500/50 text-white cursor-wait'
                                            : selectedOption === 'premium'
                                                ? 'bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-lg shadow-amber-900/20'
                                                : 'bg-slate-800 hover:bg-slate-700 text-white'
                                        }`}
                                >
                                    {isLoading && selectedOption === 'premium' ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        'Upgrade to Empire'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center mt-8">
                    <button
                        onClick={onClose}
                        className="text-slate-500 text-sm font-medium hover:text-white transition-colors tracking-wide"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
}

// Simple English English variants

export function ChatLimitModal({
    isOpen,
    onClose,
    onSelectOption,
    isLoading,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelectOption: (type: string, currency: 'NGN' | 'USD') => void;
    isLoading?: boolean;
}) {
    return (
        <PaywallModal
            isOpen={isOpen}
            onClose={onClose}
            title="Empire Status"
            subtitle="You have reached your free chat limit of 15. Go Premium for unlimited trading."
            headerGradient="from-slate-900 to-slate-800"
            options={[]} // Removing standalone chat pass
            onSelectOption={onSelectOption}
            showPremiumUpsell={true}
            isLoading={isLoading}
        />
    );
}

export function DistressBoostModal({
    isOpen,
    onClose,
    onSelectOption,
    isPremium = false,
    isLoading,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelectOption: (type: string, currency: 'NGN' | 'USD') => void;
    isPremium?: boolean;
    isLoading?: boolean;
}) {
    return (
        <PaywallModal
            isOpen={isOpen}
            onClose={onClose}
            title="Get Noticed Instantly"
            subtitle="Don't let your item get buried. For a tiny fee, we'll put your listing in front of thousands of active buyers."
            headerGradient="from-slate-900 to-slate-800"
            options={[
                {
                    id: 'cross_list',
                    title: 'Cross-List to Marketplace',
                    description: 'Push your ad to the main feed where everyone sees it.',
                    prices: { NGN: 0, USD: 0 },
                    icon: <MapPin className="w-6 h-6" />,
                    badge: 'FREE',
                    badgeColor: 'bg-green-600',
                    quickFeatures: ['All users', 'Main feed spot', 'Permanent'],
                    detailedBenefits: [
                        "Moves your listing from the side-feed to the central marketplace stream",
                        "Increases organic engagement by up to 300%",
                        "Perfect for moving inventory quickly to clear space"
                    ]
                },
                {
                    id: 'aggressive_boost',
                    title: 'Aggressive Targeted Boost',
                    description: '"Don\'t wait for buyers. We\'ll ping the 10 most interested people instantly."',
                    prices: { NGN: 1000, USD: 299 },
                    icon: <Bell className="w-6 h-6 fill-current" />,
                    isPrimary: true,
                    badge: 'BEST VALUE',
                    badgeColor: 'bg-red-600',
                    quickFeatures: ['Smart Pings', 'In-Region', 'High Intent'],
                    detailedBenefits: [
                        "Proprietary Smart Targeting notifies the Top 10 users currently searching for items like yours",
                        "Filters for buyers specifically in your region for faster handovers",
                        "Bypasses casual browsing by putting your link directly in their notifications"
                    ]
                },
            ]}
            onSelectOption={onSelectOption}
            showPremiumUpsell={!isPremium}
            isLoading={isLoading}
        />
    );
}

export function SpotlightModal({
    isOpen,
    onClose,
    onSelectOption,
    onUseCredit,
    creditsAvailable = 0,
    isLoading,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelectOption: (type: string, currency: 'NGN' | 'USD') => void;
    onUseCredit?: (optionId: string) => void;
    creditsAvailable?: number;
    isLoading?: boolean;
}) {
    return (
        <PaywallModal
            isOpen={isOpen}
            onClose={onClose}
            title="Sell 3x Faster Today!"
            subtitle="For only ₦500, put your item at the very top of search results so buyers see you first."
            headerGradient="from-slate-900 to-slate-800"
            options={[
                {
                    id: 'spotlight_3',
                    title: 'Spotlight - 3 Days',
                    description: 'Fix your ad at the top of its category for a 72-hour visibility peak.',
                    prices: { NGN: 500, USD: 199 },
                    icon: <Star className="w-6 h-6 fill-current" />,
                    badge: 'IMPULSE BUY',
                    badgeColor: 'bg-green-500',
                    quickFeatures: ['Top spot', 'Best for quick sales'],
                    detailedBenefits: [
                        "Category-specific featured banner",
                        "3x more clicks than standard listings",
                        "Great for items needing a quick pulse check",
                        "⏱️ Days stack if purchased multiple times"
                    ]
                },
                {
                    id: 'spotlight_7',
                    title: 'Spotlight - 7 Days',
                    description: '"Own the homepage for a week. Perfect for cars, phones, and high-ticket items."',
                    prices: { NGN: 1200, USD: 399 },
                    originalPrices: { NGN: 4000, USD: 1299 },
                    icon: <TrendingUp className="w-6 h-6" />,
                    isPrimary: true,
                    badge: 'BEST FOR CARS',
                    badgeColor: 'bg-blue-600',
                    quickFeatures: ['One full week', 'Highest views', 'Verified Badge'],
                    detailedBenefits: [
                        "Fixed homepage rotating carousel placement",
                        "Extended 7-day run-time for complex negotiations",
                        "Boosts seller credibility with 'Featured' tag",
                        "⏱️ Days stack if purchased multiple times"
                    ]
                },
            ]}
            onSelectOption={onSelectOption}
            onUseCredit={onUseCredit}
            creditsAvailable={creditsAvailable}
            showPremiumUpsell={true}
            isLoading={isLoading}
        />
    );
}
export function PostLimitModal({
    isOpen,
    onClose,
    onSelectOption,
    isLoading,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelectOption: (type: string, currency: 'NGN' | 'USD') => void;
    isLoading?: boolean;
}) {
    return (
        <PaywallModal
            isOpen={isOpen}
            onClose={onClose}
            title="Grow your audience"
            subtitle="Free users are limited to 50 posts per day. Upgrade to Empire Status for unlimited posting."
            headerGradient="from-blue-600 to-indigo-600"
            options={[]}
            onSelectOption={onSelectOption}
            showPremiumUpsell={true}
            isLoading={isLoading}
        />
    );
}

export function OfferLimitModal({
    isOpen,
    onClose,
    onSelectOption,
    isLoading,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSelectOption: (type: string, currency: 'NGN' | 'USD') => void;
    isLoading?: boolean;
}) {
    return (
        <PaywallModal
            isOpen={isOpen}
            onClose={onClose}
            title="Make more offers"
            subtitle="Free users are limited to 5 offers per day. Upgrade to Empire Status for unlimited offers."
            headerGradient="from-amber-600 to-orange-600"
            options={[]}
            onSelectOption={onSelectOption}
            showPremiumUpsell={true}
            isLoading={isLoading}
        />
    );
}

export function FirstChatModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white text-center">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Safe Trading</h2>
                    <p className="text-blue-100 text-sm">You're about to start a conversation with a fellow BarterWave member.</p>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 text-sm">Stay on Platform</p>
                            <p className="text-xs text-slate-500">Keep chats on BarterWave for your protection and trade history.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                            <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 text-sm">Be Clear</p>
                            <p className="text-xs text-slate-500">Discuss trade details, conditions, and meeting spots clearly.</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors mt-4"
                    >
                        Got it, Let's Chat!
                    </button>
                </div>
            </div>
        </div>
    );
}
