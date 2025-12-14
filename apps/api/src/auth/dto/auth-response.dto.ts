export class AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        name?: string;
        role: string;
        createdAt: string;
        onboardingCompleted: boolean;
        isVerified: boolean;
        verificationStatus: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
        status?: 'active' | 'suspended' | 'banned';
        rejectionReason?: string;
        phoneNumber?: string;
        locationLat?: number;
        locationLng?: number;
        locationAddress?: string;
        profile?: {
            displayName?: string;
            countryId?: number;
            regionId?: number;
        };
    };
}
