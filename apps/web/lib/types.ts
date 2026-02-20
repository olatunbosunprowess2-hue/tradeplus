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
    status?: 'active' | 'suspended' | 'banned'; // Account status
    tier?: 'free' | 'premium';
    spotlightCredits?: number;
    chatPassExpiry?: string;
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

    // Brand Verification Fields
    brandVerificationStatus?: 'NONE' | 'PENDING' | 'VERIFIED_BRAND' | 'REJECTED';
    brandName?: string;
    brandPhysicalAddress?: string;
    brandPhoneNumber?: string;
    brandWhatsApp?: string;
    brandProofUrls?: string[];
    brandVerifiedAt?: string;
    locationLat?: number;
    locationLng?: number;
    locationAddress?: string;
    city?: string;
    state?: string;
    countryId?: number;

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

    // RBAC Role
    userRole?: {
        id: string;
        name: string;
        level: number;
        description?: string;
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
    isAvailable?: boolean;
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

    // Downpayment
    downpaymentCents?: number;
    downpaymentCurrency?: string;

    // Item-Level Downpayment Overrides
    hasDownpaymentOverride?: boolean;
    overrideType?: 'FIXED' | 'PERCENTAGE';
    overrideValue?: number;

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
    status: 'pending' | 'accepted' | 'rejected' | 'countered' | 'cancelled' | 'awaiting_meetup' | 'dispute';
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

    // Downpayment Tracking
    downpaymentStatus: 'none' | 'awaiting_payment' | 'paid' | 'confirmed';
    downpaymentPaidAt?: string;
    downpaymentConfirmedAt?: string;

    // Anti-Ghosting Timer
    timerExpiresAt?: string;
    timerPausedAt?: string;
    extensionCount: number;

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

// Community Feed Types
export interface PostAuthor {
    id: string;
    firstName?: string;
    lastName?: string;
    tier?: 'free' | 'premium';
    isVerified: boolean;
    verificationStatus: string;
    brandVerificationStatus?: string;
    brandName?: string;
    profile?: {
        displayName?: string;
        avatarUrl?: string;
    };
}

export interface CommunityPost {
    id: string;
    authorId: string;
    author: PostAuthor;
    content: string;
    hashtags: string[];
    images: string[];
    status: string;
    createdAt: string;
    updatedAt: string;
    _count: {
        comments: number;
        offers: number;
    };
    isSaved?: boolean;
}

export interface PostComment {
    id: string;
    postId: string;
    authorId: string;
    author: PostAuthor;
    content: string;
    createdAt: string;
}

export interface PostOffer {
    id: string;
    postId: string;
    offererId: string;
    offerer: PostAuthor;
    message: string;
    status: string;
    createdAt: string;
}
