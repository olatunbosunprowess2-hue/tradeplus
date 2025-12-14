import { IsString, Length, IsUUID } from 'class-validator';

export class ConfirmEscrowDto {
    @IsUUID()
    orderId: string;

    @IsString()
    @Length(6, 6, { message: 'Confirmation code must be exactly 6 digits' })
    confirmationCode: string;
}
