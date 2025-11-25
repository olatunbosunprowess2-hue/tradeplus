import {
    IsString,
    IsNotEmpty,
    IsArray,
    ValidateNested,
    IsEnum,
    IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
    @IsString()
    @IsNotEmpty()
    listingId: string;

    @IsNotEmpty()
    quantity: number;

    @IsEnum(['cash', 'barter', 'cash_plus_barter'])
    dealType: 'cash' | 'barter' | 'cash_plus_barter';

    @IsString()
    @IsOptional()
    barterOfferId?: string;
}

export class CreateOrderDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsEnum(['meet_in_person', 'ship_item'])
    shippingMethod: 'meet_in_person' | 'ship_item';

    @IsString()
    @IsOptional()
    barterOfferId?: string; // If order is from an accepted barter
}
