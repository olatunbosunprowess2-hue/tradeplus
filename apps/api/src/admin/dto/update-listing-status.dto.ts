import { IsEnum } from 'class-validator';

export class UpdateListingStatusDto {
    @IsEnum(['active', 'paused', 'sold', 'removed', 'suspended'])
    status: 'active' | 'paused' | 'sold' | 'removed' | 'suspended';
}
