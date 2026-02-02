import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ResolveDisputeDto {
    @IsString()
    @IsOptional()
    resolution?: string; // 'full_refund', 'partial_refund', 'no_action', 'warning_issued'

    @IsString()
    @IsOptional()
    @MaxLength(2000)
    adminNotes?: string;
}
