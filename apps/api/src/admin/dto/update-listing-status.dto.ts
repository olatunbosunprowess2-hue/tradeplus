import { IsEnum } from 'class-validator';

export class UpdateListingStatusDto {
    @IsEnum(['active', 'paused', 'sold', 'removed'])
    status: 'active' | 'paused' | 'sold' | 'removed';
}
