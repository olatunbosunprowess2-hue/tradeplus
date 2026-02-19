import { IsBoolean, IsEnum, IsNumber, IsOptional, Max, Min } from 'class-validator';

export enum DownpaymentType {
    FIXED = 'FIXED',
    PERCENTAGE = 'PERCENTAGE',
}

export class UpdateBrandSettingsDto {
    @IsOptional()
    @IsBoolean()
    requireDownpayment?: boolean;

    @IsOptional()
    @IsEnum(DownpaymentType)
    downpaymentType?: DownpaymentType;

    @IsOptional()
    @IsNumber()
    @Min(0)
    downpaymentValue?: number; // In cents if FIXED, or 0-50 if PERCENTAGE

    @IsOptional()
    @IsNumber()
    @Min(10) // Minimum 10 minutes
    @Max(1440) // Maximum 24 hours
    defaultTimerDuration?: number;
}
