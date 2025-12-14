import { IsString, IsOptional, IsInt, IsBoolean, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    displayName?: string;

    @IsString()
    @IsOptional()
    bio?: string;

    @IsString()
    @IsOptional()
    avatarUrl?: string;

    @IsInt()
    @IsOptional()
    countryId?: number;

    @IsInt()
    @IsOptional()
    regionId?: number;

    @IsString()
    @IsOptional()
    verificationStatus?: string;

    @IsString()
    @IsOptional()
    idDocumentFrontUrl?: string;

    @IsString()
    @IsOptional()
    idDocumentBackUrl?: string;

    @IsString()
    @IsOptional()
    faceVerificationUrl?: string;

    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @IsString()
    @IsOptional()
    idDocumentType?: string;

    @IsString()
    @IsOptional()
    firstName?: string;

    @IsString()
    @IsOptional()
    lastName?: string;

    @IsString()
    @IsOptional()
    locationAddress?: string;

    @IsNumber()
    @IsOptional()
    locationLat?: number;

    @IsNumber()
    @IsOptional()
    locationLng?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    onboardingCompleted?: boolean;
}
