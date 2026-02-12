import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsInt,
    IsBoolean,
    IsNumber,
    IsArray,
    Min,
    ValidateIf,
} from 'class-validator';

import { Type, Transform } from 'class-transformer';

export class CreateListingDto {
    @IsInt()
    @IsNotEmpty()
    @Type(() => Number)
    categoryId: number;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsNotEmpty()
    type: 'PHYSICAL' | 'SERVICE';

    @IsString()
    @IsOptional()
    condition?: 'new' | 'used';

    @IsNumber()
    @Min(0)
    @ValidateIf((o) => o.allowCash)
    @IsOptional()
    @Type(() => Number)
    priceCents?: number;

    @IsString()
    @IsOptional()
    currencyCode?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    @Type(() => Number)
    downpaymentCents?: number;

    @IsString()
    @IsOptional()
    downpaymentCurrency?: string;

    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    allowCash: boolean;

    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    allowBarter: boolean;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true || false)
    allowCashPlusBarter?: boolean;

    @IsString()
    @IsOptional()
    preferredBarterNotes?: string;

    // Structured Barter Preferences
    @IsString()
    @IsOptional()
    barterPreference1?: string;

    @IsString()
    @IsOptional()
    barterPreference2?: string;

    @IsString()
    @IsOptional()
    barterPreference3?: string;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    barterPreferencesOnly?: boolean;

    @IsInt()
    @Min(1)
    @IsOptional()
    @Type(() => Number)
    quantity?: number;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    isAvailable?: boolean;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    shippingMeetInPerson?: boolean;

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    shippingShipItem?: boolean;

    @IsInt()
    @IsOptional()
    @Type(() => Number)
    countryId?: number;

    @IsInt()
    @IsOptional()
    @Type(() => Number)
    regionId?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    imageUrls?: string[];

    @IsString()
    @IsOptional()
    videoUrl?: string;

    // Distress Sale Fields
    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    isDistressSale?: boolean;

    @IsString()
    @IsOptional()
    distressReason?: string; // 'urgent_cash', 'relocating', 'clearing_stock'
}
