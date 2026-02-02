/**
 * BarterWave Monetization Pricing Constants
 * All amounts are in kobo (Nigerian currency smallest unit)
 * 1 Naira = 100 kobo
 */

export const PRICING = {
    // Pay-As-You-Go Services (using psychological price points)
    CHAT_PASS: { NGN: 100000, USD: 499 },            // ₦1,000 / $4.99
    CROSS_LIST: { NGN: 150000, USD: 399 },           // ₦1,500 / $3.99
    AGGRESSIVE_BOOST: { NGN: 400000, USD: 999 },     // ₦4,000 / $9.99
    AGGRESSIVE_BOOST_PREMIUM: { NGN: 200000, USD: 499 }, // 50% off for verified users
    SPOTLIGHT_3_DAYS: { NGN: 200000, USD: 599 },     // ₦2,000 / $5.99
    SPOTLIGHT_7_DAYS: { NGN: 400000, USD: 1299 },    // ₦4,000 / $12.99

    // Subscription
    EMPIRE_STATUS: { NGN: 700000, USD: 1499 },       // ₦7,000 / $14.99
    PREMIUM_MONTHLY: { NGN: 700000, USD: 1499 },     // Alias for Empire Status
};

export const LIMITS = {
    FREE_LISTINGS: 5,               // Max active listings for free users
    FREE_DAILY_CHATS: 3,            // Max new chat initiations per day
    PREMIUM_SPOTLIGHT_CREDITS: 2,   // Free spotlight credits for new premium subscribers
};

export const PURCHASE_TYPES = {
    CHAT_PASS: 'chat_pass',
    CROSS_LIST: 'cross_list',
    AGGRESSIVE_BOOST: 'aggressive_boost',
    SPOTLIGHT_3: 'spotlight_3',
    SPOTLIGHT_7: 'spotlight_7',
    PREMIUM: 'premium',
} as const;

export type PurchaseType = typeof PURCHASE_TYPES[keyof typeof PURCHASE_TYPES];

export type Currency = 'NGN' | 'USD';

export const getPrice = (type: PurchaseType, currency: Currency = 'NGN'): number => {
    const key = type === 'premium' ? 'EMPIRE_STATUS' : type.toUpperCase() as keyof typeof PRICING;
    const priceSet = PRICING[key as keyof typeof PRICING] as { NGN: number; USD: number };
    return priceSet[currency];
};
