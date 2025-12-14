import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminUserQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(['user', 'admin'])
    role?: 'user' | 'admin';

    @IsOptional()
    @IsEnum(['active', 'suspended'])
    status?: 'active' | 'suspended';

    @IsOptional()
    @IsEnum(['PENDING', 'VERIFIED', 'REJECTED', 'NONE'])
    verificationStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'NONE';

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 20;
}
