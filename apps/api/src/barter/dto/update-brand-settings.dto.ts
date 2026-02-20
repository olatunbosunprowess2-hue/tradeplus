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
    @Max(50) // 50% safety cap for percentage type; for FIXED, the raw value in cents
    downpaymentValue?: number;

    @IsOptional()
    @IsNumber()
    @Min(10) // Minimum 10 minutes
    @Max(1440) // Maximum 24 hours
    defaultTimerDuration?: number;
}
