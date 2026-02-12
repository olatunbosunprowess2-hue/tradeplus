import { IsString, IsEmail, IsOptional, IsUrl, MinLength, MaxLength } from 'class-validator';

export class BrandApplyDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    brandName: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    brandWebsite?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    brandInstagram?: string;

    @IsOptional()
    @IsString()
    @MaxLength(500)
    brandPhysicalAddress?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    brandPhoneNumber?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    brandWhatsApp?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    brandApplicationNote?: string;

    @IsString({ each: true })
    brandProofUrls: string[];
}

export class WaitlistDto {
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    source?: string;
}

export class BrandRejectDto {
    @IsString()
    @MinLength(5)
    @MaxLength(1000)
    reason: string;
}
