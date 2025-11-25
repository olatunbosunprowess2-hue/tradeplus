import { IsOptional, IsEnum, IsString } from 'class-validator';

export class OfferQueryDto {
    @IsOptional()
    @IsEnum(['sent', 'received'])
    type?: 'sent' | 'received';

    @IsOptional()
    @IsEnum(['pending', 'accepted', 'rejected', 'countered', 'expired'])
    status?: 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';

    @IsOptional()
    @IsString()
    listingId?: string;
}
