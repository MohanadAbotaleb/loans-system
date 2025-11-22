import { IsString, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateRepaymentDto {
    @IsString()
    @IsUUID()
    loanId: string;

    @IsNumber()
    @IsPositive()
    amount: number;
}
