import { IsUUID, IsEnum, IsOptional, IsString } from 'class-validator';

export enum PaymentProvider {
    MOCK = 'mock',
    PAYSTACK = 'paystack',
    FLUTTERWAVE = 'flutterwave',
}

export class InitiateEscrowDto {
    @IsUUID()
    listingId: string;

    @IsEnum(PaymentProvider)
    @IsOptional()
    paymentProvider?: PaymentProvider = PaymentProvider.MOCK;

    @IsString()
    @IsOptional()
    shippingMethod?: string = 'meet_in_person';
}
