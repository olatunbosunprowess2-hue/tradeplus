import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateListingStatusDto {
    @IsEnum(['active', 'paused', 'sold', 'removed', 'suspended'])
    status: 'active' | 'paused' | 'sold' | 'removed' | 'suspended';

    @IsOptional()
    @IsString()
    adminMessage?: string;
}
