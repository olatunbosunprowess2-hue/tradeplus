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

export class CreateListingDto {
    @IsInt()
    @IsNotEmpty()
    categoryId: number;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsNotEmpty()
    condition: 'new' | 'used';

    @IsNumber()
    @Min(0)
    @ValidateIf((o) => o.allowCash)
    @IsOptional()
    priceCents?: number;

    @IsString()
    @IsOptional()
    currencyCode?: string;

    @IsBoolean()
    allowCash: boolean;

    @IsBoolean()
    allowBarter: boolean;

    @IsBoolean()
    allowCashPlusBarter: boolean;

    @IsString()
    @IsOptional()
    preferredBarterNotes?: string;

    @IsInt()
    @Min(1)
    @IsOptional()
    quantity?: number;

    @IsBoolean()
    @IsOptional()
    shippingMeetInPerson?: boolean;

    @IsBoolean()
    @IsOptional()
    shippingShipItem?: boolean;

    @IsInt()
    @IsOptional()
    countryId?: number;

    @IsInt()
    @IsOptional()
    regionId?: number;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    imageUrls?: string[];
}
