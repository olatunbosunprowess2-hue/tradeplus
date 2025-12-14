/**
 * Comprehensive currency support for international trading
 * Includes formatting, symbols, and country-to-currency mapping
 */

export interface Currency {
    code: string;
    name: string;
    symbol: string;
    locale: string;
    decimalDigits: number;
}

// Comprehensive list of 25+ global currencies
export const CURRENCIES: Currency[] = [
    // Africa
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', locale: 'en-NG', decimalDigits: 2 },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', locale: 'en-ZA', decimalDigits: 2 },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', locale: 'en-KE', decimalDigits: 2 },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', locale: 'en-GH', decimalDigits: 2 },
    { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', locale: 'ar-EG', decimalDigits: 2 },
    { code: 'MAD', name: 'Moroccan Dirham', symbol: 'DH', locale: 'ar-MA', decimalDigits: 2 },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', locale: 'sw-TZ', decimalDigits: 0 },
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', locale: 'en-UG', decimalDigits: 0 },
    { code: 'XOF', name: 'West African CFA', symbol: 'CFA', locale: 'fr-SN', decimalDigits: 0 },

    // Americas
    { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US', decimalDigits: 2 },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA', decimalDigits: 2 },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', locale: 'pt-BR', decimalDigits: 2 },
    { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', locale: 'es-MX', decimalDigits: 2 },

    // Europe
    { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE', decimalDigits: 2 },
    { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB', decimalDigits: 2 },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', locale: 'de-CH', decimalDigits: 2 },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', locale: 'sv-SE', decimalDigits: 2 },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', locale: 'nb-NO', decimalDigits: 2 },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', locale: 'pl-PL', decimalDigits: 2 },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽', locale: 'ru-RU', decimalDigits: 2 },

    // Asia & Pacific
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN', decimalDigits: 2 },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', decimalDigits: 0 },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', locale: 'zh-CN', decimalDigits: 2 },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU', decimalDigits: 2 },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', locale: 'en-NZ', decimalDigits: 2 },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG', decimalDigits: 2 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'AED', locale: 'ar-AE', decimalDigits: 2 },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', locale: 'ar-SA', decimalDigits: 2 },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱', locale: 'en-PH', decimalDigits: 2 },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', locale: 'id-ID', decimalDigits: 0 },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', locale: 'ms-MY', decimalDigits: 2 },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', locale: 'th-TH', decimalDigits: 2 },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs', locale: 'en-PK', decimalDigits: 2 },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', locale: 'bn-BD', decimalDigits: 2 },
];

// Map country codes (ISO 3166-1 alpha-2) to currency codes
export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
    // Africa
    'NG': 'NGN', 'ZA': 'ZAR', 'KE': 'KES', 'GH': 'GHS', 'EG': 'EGP',
    'MA': 'MAD', 'TZ': 'TZS', 'UG': 'UGX', 'SN': 'XOF', 'CI': 'XOF',
    'CM': 'XOF', 'BF': 'XOF', 'ML': 'XOF', 'NE': 'XOF', 'TG': 'XOF',
    'BJ': 'XOF', 'GA': 'XOF', 'CG': 'XOF', 'RW': 'RWF', 'ET': 'ETB',

    // Americas
    'US': 'USD', 'CA': 'CAD', 'BR': 'BRL', 'MX': 'MXN', 'AR': 'ARS',
    'CO': 'COP', 'CL': 'CLP', 'PE': 'PEN',

    // Europe
    'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR',
    'BE': 'EUR', 'AT': 'EUR', 'PT': 'EUR', 'IE': 'EUR', 'FI': 'EUR',
    'GR': 'EUR', 'SK': 'EUR', 'SI': 'EUR', 'LT': 'EUR', 'LV': 'EUR',
    'EE': 'EUR', 'MT': 'EUR', 'CY': 'EUR', 'LU': 'EUR',
    'GB': 'GBP', 'CH': 'CHF', 'SE': 'SEK', 'NO': 'NOK', 'PL': 'PLN',
    'RU': 'RUB', 'UA': 'UAH', 'CZ': 'CZK', 'DK': 'DKK', 'HU': 'HUF',
    'RO': 'RON', 'TR': 'TRY',

    // Asia & Pacific
    'IN': 'INR', 'JP': 'JPY', 'CN': 'CNY', 'AU': 'AUD', 'NZ': 'NZD',
    'SG': 'SGD', 'AE': 'AED', 'SA': 'SAR', 'PH': 'PHP', 'ID': 'IDR',
    'MY': 'MYR', 'TH': 'THB', 'PK': 'PKR', 'BD': 'BDT', 'VN': 'VND',
    'KR': 'KRW', 'HK': 'HKD', 'TW': 'TWD', 'IL': 'ILS', 'QA': 'QAR',
    'KW': 'KWD', 'BH': 'BHD', 'OM': 'OMR',
};

/**
 * Get currency by code
 */
export function getCurrencyByCode(code: string): Currency | undefined {
    return CURRENCIES.find(c => c.code === code);
}

/**
 * Get currency by country code (ISO 3166-1 alpha-2)
 */
export function getCurrencyByCountry(countryCode: string): Currency {
    const currencyCode = COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] || 'USD';
    return getCurrencyByCode(currencyCode) || CURRENCIES.find(c => c.code === 'USD')!;
}

/**
 * Format price with proper currency symbol and locale
 */
export function formatPrice(amountCents: number, currencyCode: string): string {
    const currency = getCurrencyByCode(currencyCode);
    if (!currency) {
        return `${currencyCode} ${(amountCents / 100).toFixed(2)}`;
    }

    const amount = amountCents / 100;

    try {
        return new Intl.NumberFormat(currency.locale, {
            style: 'currency',
            currency: currency.code,
            minimumFractionDigits: currency.decimalDigits,
            maximumFractionDigits: currency.decimalDigits,
        }).format(amount);
    } catch {
        // Fallback if Intl fails
        return `${currency.symbol}${amount.toFixed(currency.decimalDigits)}`;
    }
}

/**
 * Get simple symbol + amount format
 */
export function formatPriceSimple(amountCents: number, currencyCode: string): string {
    const currency = getCurrencyByCode(currencyCode);
    if (!currency) {
        return `${currencyCode} ${(amountCents / 100).toFixed(2)}`;
    }

    const amount = amountCents / 100;
    const formattedAmount = amount.toLocaleString(undefined, {
        minimumFractionDigits: currency.decimalDigits,
        maximumFractionDigits: currency.decimalDigits,
    });

    return `${currency.symbol}${formattedAmount}`;
}

/**
 * Extract country code from Nominatim reverse geocoding response
 */
export function extractCountryCode(geocodeAddress: any): string | null {
    if (!geocodeAddress) return null;

    // Nominatim response format
    if (geocodeAddress.country_code) {
        return geocodeAddress.country_code.toUpperCase();
    }

    // Alternative formats
    if (geocodeAddress.address?.country_code) {
        return geocodeAddress.address.country_code.toUpperCase();
    }

    return null;
}

/**
 * Get grouped currencies for select dropdowns
 */
export function getGroupedCurrencies() {
    return {
        'Popular': CURRENCIES.filter(c => ['NGN', 'USD', 'GBP', 'EUR', 'ZAR', 'GHS', 'KES'].includes(c.code)),
        'Africa': CURRENCIES.filter(c => ['NGN', 'ZAR', 'KES', 'GHS', 'EGP', 'MAD', 'TZS', 'UGX', 'XOF'].includes(c.code)),
        'Americas': CURRENCIES.filter(c => ['USD', 'CAD', 'BRL', 'MXN'].includes(c.code)),
        'Europe': CURRENCIES.filter(c => ['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'PLN', 'RUB'].includes(c.code)),
        'Asia & Pacific': CURRENCIES.filter(c => ['INR', 'JPY', 'CNY', 'AUD', 'NZD', 'SGD', 'AED', 'SAR', 'PHP', 'IDR', 'MYR', 'THB', 'PKR', 'BDT'].includes(c.code)),
    };
}

// Default currency (can be changed based on user preference or location)
export const DEFAULT_CURRENCY = 'NGN';
