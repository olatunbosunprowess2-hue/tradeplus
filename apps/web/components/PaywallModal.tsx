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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.15)] ring-1 ring-slate-100 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                {/* Fixed Header */}
                <div className={`bg-gradient-to-br ${headerGradient} px-8 pt-8 pb-6 text-white relative flex-shrink-0 overflow-hidden`}>
                    {/* Decorative Background Elements */}
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 blur-3xl rounded-full pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 blur-3xl rounded-full pointer-events-none" />

                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 p-2 rounded-full bg-black/20 hover:bg-white text-white hover:text-slate-900 shadow-sm border border-white/20 backdrop-blur-md transition-all z-20 group/close"
                        aria-label="Close modal"
                    >
                        <X className="w-4 h-4 group-hover/close:rotate-90 transition-transform duration-300" />
                    </button>

                    {/* Currency Toggle */}
                    <div className="absolute top-5 left-8 z-20">
                        <div className="bg-black/20 backdrop-blur-md p-1 rounded-xl border border-white/10 flex items-center gap-1 shadow-inner">
                            <button
                                onClick={() => setCurrency('NGN')}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide transition-all flex items-center gap-1.5
                                    ${currency === 'NGN'
                                        ? 'bg-white text-slate-900 shadow-md'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'}
                                `}
                            >
                                <span>🇳🇬</span> NGN
                            </button>
                            <button
                                onClick={() => setCurrency('USD')}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide transition-all flex items-center gap-1.5
                                    ${currency === 'USD'
                                        ? 'bg-white text-slate-900 shadow-md'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'}
                                `}
                            >
                                <span>🇺🇸</span> USD
                            </button>
                        </div>
                    </div>
                    <div className="relative z-10 pt-8">
                        <div className="flex items-center gap-2 mb-2 justify-center">
                            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse-subtle" />
                            <h2 className="text-2xl font-black tracking-tight text-center drop-shadow-sm">{title}</h2>
                            <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse-subtle" />
                        </div>
                        {subtitle && <p className="text-white/80 text-sm font-medium text-center max-w-[90%] mx-auto leading-relaxed">{subtitle}</p>}
                    </div>
                </div>

                {/* Scrollable Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {options.map((option) => (
                        <div key={option.id} className="space-y-3">
                            <button
                                onClick={() => handleSelect(option.id)}
                                disabled={isLoading}
                                className={`w-full p-5 rounded-[2rem] border-2 transition-all duration-300 relative group text-left overflow-hidden
                                    ${option.isPrimary
                                        ? 'border-blue-500 bg-gradient-to-b from-blue-50/50 to-white shadow-[0_8px_20px_rgb(59,130,246,0.1)] hover:-translate-y-1'
                                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg hover:-translate-y-0.5 bg-white'
                                    }
                                    ${isLoading && selectedOption === option.id ? 'opacity-60 cursor-wait' : ''}
                                `}
                            >
                                {/* Primary Option Glow Effect */}
                                {option.isPrimary && (
                                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                )}

                                {option.badge && (
                                    <span className={`absolute -top-3 right-6 px-3 py-0.5 text-[10px] font-black text-white rounded-full z-10 border border-white shadow-sm tracking-wide ${option.badgeColor || 'bg-blue-600'}`}>
                                        {option.badge}
                                    </span>
                                )}

                                <div className="flex items-start gap-4 relative z-10">
                                    <div className={`w-12 h-12 rounded-[1.25rem] flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105
                                        ${option.isPrimary
                                            ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {option.icon}
                                    </div>

                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">{option.title}</h3>
                                            <div className="text-right">
                                                {option.originalPrices && (
                                                    <span className="text-[10px] text-slate-400 line-through block font-black">
                                                        {formatPrice(option.originalPrices[currency], currency)}
                                                    </span>
                                                )}
                                                <span className={`font-black text-lg tracking-tight ${option.isPrimary ? 'text-blue-600' : 'text-slate-900'}`}>
                                                    {formatPrice(option.prices[currency], currency)}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-500 font-medium mb-3 leading-snug">{option.description}</p>

                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {option.quickFeatures?.map((f, i) => (
                                                <span key={i} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${option.isPrimary ? 'bg-blue-100/50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    <Check className={`w-3 h-3 ${option.isPrimary ? 'text-blue-600' : 'text-slate-400'}`} />
                                                    {f}
                                                </span>
                                            ))}
                                        </div>

                                        {option.detailedBenefits && (
                                            <div className="mt-2 text-right">
                                                <button
                                                    onClick={(e) => toggleExpand(e, option.id)}
                                                    className="text-[10px] font-black text-blue-600 uppercase tracking-tighter hover:underline flex items-center gap-1 ml-auto"
                                                >
                                                    {expandedOption === option.id ? 'Show Less' : 'More Information'}
                                                    <Zap className={`w-3 h-3 ${expandedOption === option.id ? 'rotate-180' : ''} transition-transform`} />
                                                </button>

                                                {expandedOption === option.id && (
                                                    <ul className="mt-3 space-y-2 animate-in slide-in-from-top-2 duration-300 text-left">
                                                        {option.detailedBenefits.map((benefit, i) => (
                                                            <li key={i} className="flex items-start gap-2">
                                                                <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                                                <span className="text-[11px] text-slate-600 font-medium leading-normal italic">{benefit}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isLoading && selectedOption === option.id && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-3xl backdrop-blur-[1px] z-20">
                                        <div className="flex items-center gap-2 text-blue-600 py-2 px-4 bg-white rounded-full shadow-lg border border-slate-100">
                                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm font-bold">Please wait...</span>
                                        </div>
                                    </div>
                                )}
                            </button>

                            {/* Free Credit Option for Spotlight */}
                            {creditsAvailable > 0 && option.id === 'spotlight_7' && onUseCredit && (
                                <button
                                    onClick={() => onUseCredit(option.id)}
                                    disabled={isLoading}
                                    className="w-full py-4 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-100 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all group overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                        <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-[10px] font-black uppercase tracking-widest opacity-80">Premium Perk</div>
                                        <div className="text-sm font-black">USE 1 FREE CREDIT ({creditsAvailable} left)</div>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 opacity-40 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Premium Card - Simplified */}
                    {showPremiumUpsell && (
                        <div className="space-y-2">
                            <button
                                onClick={() => handleSelect('premium')}
                                disabled={isLoading}
                                className="w-full mt-2 relative p-6 rounded-[2rem] text-white shadow-[0_15px_40px_rgba(15,23,42,0.6)] hover:shadow-[0_20px_50px_rgba(15,23,42,0.8)] hover:-translate-y-1 transition-all duration-300 overflow-hidden group text-left border border-slate-700 hover:border-slate-500 bg-slate-900"
                            >
                                {/* Animated Dark Background Elements */}
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-black z-0" />
                                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/20 transition-all duration-700 z-0" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10 group-hover:bg-blue-500/20 transition-all duration-700 z-0" />

                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(251,191,36,0.5)] border border-white/20 group-hover:scale-110 transition-transform duration-500">
                                        <Crown className="w-6 h-6 text-white drop-shadow-sm" />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-black text-lg tracking-tight uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-200 to-yellow-400">Empire Status</h3>
                                        <span className="inline-block mt-0.5 text-[9px] bg-amber-400/20 backdrop-blur-md text-amber-300 px-2 py-0.5 rounded-full font-black border border-amber-400/30">EARLY BIRD: 65% OFF</span>
                                    </div>
                                    <div className="text-right flex-shrink-0 pt-1">
                                        <span className="font-black text-2xl tracking-tighter block text-white drop-shadow-md">
                                            {currency === 'NGN' ? '₦2,500' : '$4.99'}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/ month</span>
                                    </div>
                                </div>

                                <div className="relative z-10 mt-4">
                                    <p className="text-sm text-slate-300 font-medium mb-4 italic leading-relaxed">
                                        "Stop counting limits. Start closing deals. Get 2x visibility and 50% off all boosts."
                                    </p>

                                    <div className="flex flex-wrap gap-2">
                                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                                            <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
                                            <span className="text-[10px] font-bold text-white">Verified Crown</span>
                                        </div>
                                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-1.5">
                                            <Star className="w-3.5 h-3.5 text-blue-400" />
                                            <span className="text-[10px] font-bold text-white">Priority Spot</span>
                                        </div>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={(e) => toggleExpand(e, 'premium')}
                                className="w-full text-center text-[10px] font-black text-slate-500 hover:text-slate-900 uppercase tracking-widest transition-colors py-1"
                            >
                                {expandedOption === 'premium' ? 'Hide Details' : 'See Everything You Get'}
                            </button>

                            {expandedOption === 'premium' && (
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 animate-in slide-in-from-top-2">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 pr-4">Premium Membership Includes:</h4>
                                    <ul className="grid grid-cols-1 gap-3 pr-4">
                                        {[
                                            { icon: <Check className="text-green-500" />, text: "Unlimited active listings (Up to 10 free)" },
                                            { icon: <Check className="text-green-500" />, text: "Unlimited chat initiations (Up to 15 free)" },
                                            { icon: <Check className="text-green-500" />, text: "Unlimited Community Posts & Offers" },
                                            { icon: <Check className="text-green-500" />, text: "Read Receipts (Seen status)" },
                                            { icon: <Check className="text-green-500" />, text: "Verified Crown Badge on profile" },
                                            { icon: <Check className="text-green-500" />, text: "Search results priority (Top placement)" },
                                            { icon: <Check className="text-green-500" />, text: "50% Discount on all Boosts" },
                                            { icon: <Check className="text-green-500" />, text: "2 Free Spotlight credits per month" },
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                                                {item.icon}
                                                {item.text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Fixed Footer */}
                <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100 text-center flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="text-slate-500 text-xs font-bold hover:text-slate-800 transition-colors uppercase tracking-widest"
                    >
                        Maybe later
                    </button>
                </div>
            </div >

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #CBD5E1;
                }
            `}</style>
        </div >
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
