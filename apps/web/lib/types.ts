// Shared types matching backend DTOs
export interface Country {
    id: number;
    name: string;
    code: string;
    currency: string;
    currencySymbol: string;
}

export interface Region {
    id: number;
    name: string;
    city: string;
    countryId: number;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    role: string;
    createdAt: string;

    // Verification Fields
    onboardingCompleted: boolean;
    isVerified: boolean;
    verificationStatus: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
    phoneNumber?: string;
    idDocumentType?: 'government_id' | 'student_id' | 'passport' | 'drivers_license';
    idDocumentFrontUrl?: string;
    idDocumentBackUrl?: string;
    faceVerificationUrl?: string;
    rejectionReason?: string;
    locationLat?: number;
    locationLng?: number;
    locationAddress?: string;

    profile?: {
        displayName?: string;
        avatarUrl?: string;
        countryId?: number;
        country?: {
            id: number;
            name: string;
        };
        regionId?: number;
        region?: {
            id: number;
            name: string;
            city: string;
        };
        bio?: string;
        rating?: number;
        reviewCount?: number;
        responseRate?: number;
    };
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}

export interface Listing {
    id: string;
    sellerId: string;
    seller: User;
    categoryId: number;
    category: {
        id: number;
        name: string;
        slug: string;
    };
    title: string;
    description?: string;
    type: 'PHYSICAL' | 'SERVICE';
    condition?: 'new' | 'used';
    priceCents?: number;
    currencyCode: string;
    allowCash: boolean;
    allowBarter: boolean;
    allowCashPlusBarter: boolean;
    preferredBarterNotes?: string;
    quantity: number;
    status: string;
    shippingMeetInPerson: boolean;
    shippingShipItem: boolean;
    countryId?: number;
    regionId?: number;
    images: ListingImage[];
    videoUrl?: string;

    // Distress Sale Fields
    isDistressSale?: boolean;
    distressReason?: string;
    distressExpiresAt?: string;

    // Barter Preferences
    barterPreference1?: string;
    barterPreference2?: string;
    barterPreference3?: string;
    barterPreferencesOnly?: boolean;

    createdAt: string;
    updatedAt: string;
}

export interface ListingImage {
    id: string;
    url: string;
    sortOrder: number;
}

export interface BarterOffer {
    id: string;
    listingId: string;
    listing: Listing;
    buyerId: string;
    buyer: User;
    sellerId: string;
    seller: User;
    status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'cancelled';
    offeredCashCents: number;
    currencyCode: string;
    message?: string;
    items: BarterOfferItem[];

    // Verification Fields
    listingOwnerConfirmedAt?: string;
    offerMakerConfirmedAt?: string;
    receiptAvailableAt?: string;
    receiptGeneratedAt?: string;
    receiptNumber?: string;
    disputeStatus: 'none' | 'opened' | 'resolved';

    createdAt: string;
    updatedAt: string;
}

export interface BarterOfferItem {
    id: string;
    offeredListingId: string;
    offeredListing: Listing;
    quantity: number;
}

export interface Order {
    id: string;
    buyerId: string;
    buyer: User;
    sellerId: string;
    seller: User;
    totalPriceCents: number;
    currencyCode: string;
    status: 'pending' | 'paid' | 'cancelled' | 'fulfilled';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
    shippingMethod: 'meet_in_person' | 'ship_item';
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface OrderItem {
    id: string;
    listingId: string;
    listing: Listing;
    quantity: number;
    priceCents: number;
    dealType: 'cash' | 'barter' | 'cash_plus_barter';
}

export interface Category {
    id: number;
    name: string;
    slug: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface Report {
    id: string;
    reporterId: string;
    reporter: User;
    reportedUserId?: string;
    reportedUser?: User;
    listingId?: string;
    listing?: Listing;
    messageId?: string;
    reason: string;
    status: 'open' | 'in_review' | 'resolved' | 'dismissed';
    evidenceImages: string[];
    createdAt: string;
    resolvedAt?: string;
    resolvedByAdminId?: string;
    resolvedByAdmin?: User;
}
