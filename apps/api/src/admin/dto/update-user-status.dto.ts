import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateUserStatusDto {
    @IsEnum(['active', 'suspended', 'banned'])
    @IsOptional()
    status?: 'active' | 'suspended' | 'banned';

    @IsEnum(['PENDING', 'VERIFIED', 'REJECTED', 'NONE'])
    @IsOptional()
    verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NONE';

    @IsOptional()
    @IsString()
    rejectionReason?: string;

    @IsOptional()
    @IsString()
    adminMessage?: string;
}
