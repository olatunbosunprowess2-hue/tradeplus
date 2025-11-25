import { PartialType } from '@nestjs/mapped-types';
import { CreateListingDto } from './create-listing.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateListingDto extends PartialType(CreateListingDto) {
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    imageUrls?: string[];

    @IsOptional()
    priceCents?: number;
}
