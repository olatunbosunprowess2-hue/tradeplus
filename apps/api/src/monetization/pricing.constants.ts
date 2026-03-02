/**
 * BarterWave Monetization Pricing Constants
 * All amounts are in kobo (Nigerian currency smallest unit)
 * 1 Naira = 100 kobo
 */

export const PRICING = {
    // Pay-As-You-Go Services (using psychological price points)
    // EMPIRE_STATUS (Subscription) - EARLY BIRD PROMO
    EMPIRE_STATUS: { NGN: 500000, USD: 700 },         // ₦5,000 / $7.00

    // Pay-As-You-Go Services (Early Adopter Price Drops)
    AGGRESSIVE_BOOST: { NGN: 0, USD: 0 },             // FREE - Temporary drop
    AGGRESSIVE_BOOST_PREMIUM: { NGN: 0, USD: 0 },     // FREE - Temporary drop
    SPOTLIGHT_3_DAYS: { NGN: 50000, USD: 199 },       // ₦500 / $1.99
    SPOTLIGHT_7_DAYS: { NGN: 120000, USD: 399 },      // ₦1,200 / $3.99
    CROSS_LIST: { NGN: 0, USD: 0 },                   // FREE - To populate the main feed

    PREMIUM_MONTHLY: { NGN: 500000, USD: 700 },      // Alias for Empire Status
    CHAT_PASS: { NGN: 0, USD: 0 },                   // DEPRECATED - Free limit is 15
};

export const LIMITS = {
    FREE_LISTINGS: 10,              // Max active listings for free users (up from 5)
    FREE_DAILY_CHATS: 15,           // Max new chat initiations per day (up from 3)
    FREE_COMMUNITY_POSTS: 50,       // Max community posts per day (sanity check for spam)
    PREMIUM_SPOTLIGHT_CREDITS: 2,   // Free spotlight credits for new premium subscribers
};

export const PURCHASE_TYPES = {
    CROSS_LIST: 'cross_list',
    AGGRESSIVE_BOOST: 'aggressive_boost',
    SPOTLIGHT_3: 'spotlight_3',
    SPOTLIGHT_7: 'spotlight_7',
    PREMIUM: 'premium',
    CHAT_PASS: 'chat_pass',
} as const;

export type PurchaseType = typeof PURCHASE_TYPES[keyof typeof PURCHASE_TYPES];

export type Currency = 'NGN' | 'USD';

export const getPrice = (type: PurchaseType, currency: Currency = 'NGN'): number => {
    let key = type.toUpperCase() as keyof typeof PRICING;
    if (type === 'premium') key = 'EMPIRE_STATUS' as keyof typeof PRICING;
    if (type === 'spotlight_3') key = 'SPOTLIGHT_3_DAYS' as keyof typeof PRICING;
    if (type === 'spotlight_7') key = 'SPOTLIGHT_7_DAYS' as keyof typeof PRICING;

    const priceSet = PRICING[key] as { NGN: number; USD: number };
    return priceSet ? priceSet[currency] : 0;
};
