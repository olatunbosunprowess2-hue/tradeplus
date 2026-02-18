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
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Fixed Header */}
                <div className={`bg-gradient-to-br ${headerGradient} px-8 py-6 text-white relative flex-shrink-0`}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 shadow-lg border border-white/30 backdrop-blur-md transition-all z-20 group/close"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5 group-hover/close:rotate-90 transition-transform duration-300" />
                    </button>

                    {/* Currency Toggle */}
                    <div className="absolute top-4 left-4 z-20">
                        <div className="bg-black/20 backdrop-blur-md p-1 rounded-xl border border-white/10 flex items-center gap-1">
                            <button
                                onClick={() => setCurrency('NGN')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5
                                    ${currency === 'NGN'
                                        ? 'bg-white text-slate-900 shadow-md scale-105'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'}
                                `}
                            >
                                <span>🇳🇬</span> NGN
                            </button>
                            <button
                                onClick={() => setCurrency('USD')}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5
                                    ${currency === 'USD'
                                        ? 'bg-white text-slate-900 shadow-md scale-105'
                                        : 'text-white/60 hover:text-white hover:bg-white/10'}
                                `}
                            >
                                <span>🇺🇸</span> USD
                            </button>
                        </div>
                    </div>
                    <div className="relative z-10 pr-8">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
                            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                        </div>
                        {subtitle && <p className="text-white/70 text-sm font-medium">{subtitle}</p>}
                    </div>
                </div>

                {/* Scrollable Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {options.map((option) => (
                        <div key={option.id} className="space-y-3">
                            <button
                                onClick={() => handleSelect(option.id)}
                                disabled={isLoading}
                                className={`w-full px-5 py-4 rounded-3xl border-2 transition-all relative group text-left
                                    ${option.isPrimary
                                        ? 'border-blue-600 bg-blue-50/30'
                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                    }
                                    ${isLoading && selectedOption === option.id ? 'opacity-60 cursor-wait' : ''}
                                `}
                            >
                                {option.badge && (
                                    <span className={`absolute -top-3 right-6 px-3 py-0.5 text-[10px] font-bold text-white rounded-full z-10 border border-white ${option.badgeColor || 'bg-blue-600'}`}>
                                        {option.badge}
                                    </span>
                                )}

                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm
                                        ${option.isPrimary
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {option.icon}
                                    </div>

                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h3 className="font-bold text-slate-900 text-base">{option.title}</h3>
                                            <div className="text-right">
                                                {option.originalPrices && (
                                                    <span className="text-[10px] text-slate-400 line-through block font-bold">
                                                        {formatPrice(option.originalPrices[currency], currency)}
                                                    </span>
                                                )}
                                                <span className={`font-bold text-lg ${option.isPrimary ? 'text-blue-600' : 'text-slate-900'}`}>
                                                    {formatPrice(option.prices[currency], currency)}
                                                </span>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-500 font-medium mb-2.5 leading-snug">{option.description}</p>

                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {option.quickFeatures?.map((f, i) => (
                                                <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                                                    <Check className="w-2.5 h-2.5 text-blue-600" />
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
                                className="w-full mt-2 relative p-5 rounded-[2rem] bg-slate-900 text-white shadow-xl hover:scale-[1.01] transition-all overflow-hidden group text-left"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />

                                <div className="flex items-start gap-4 relative z-10">
                                    <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg border border-white/20">
                                        <Crown className="w-7 h-7 text-white" />
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-bold text-base tracking-tight uppercase">Empire Status</h3>
                                        <span className="text-[9px] bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded-full font-black">EARLY BIRD PROMO: 65% OFF</span>
                                    </div>
                                    <p className="text-xs text-slate-300 font-bold mb-3 italic">
                                        "Stop counting chats. Start closing deals. Get 2x visibility and 50% off all boosts."
                                    </p>

                                    <div className="flex gap-2">
                                        <div className="bg-white/10 rounded-lg px-2 py-1 flex items-center gap-1.5">
                                            <BadgeCheck className="w-3 h-3 text-amber-400" />
                                            <span className="text-[10px] font-bold">Verified Badge</span>
                                        </div>
                                        <div className="bg-white/10 rounded-lg px-2 py-1 flex items-center gap-1.5">
                                            <Star className="w-3 h-3 text-amber-400" />
                                            <span className="text-[10px] font-bold">Priority Search</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right flex-shrink-0">
                                    <span className="font-bold text-xl block text-amber-400">
                                        {currency === 'NGN' ? '₦2,500' : '$4.99'}
                                    </span>
                                    <span className="text-[10px] font-medium opacity-60">/month</span>
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
                        "Great for items needing a quick pulse check"
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
                        "Boosts seller credibility with 'Featured' tag"
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
