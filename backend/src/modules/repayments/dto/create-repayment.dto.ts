import { IsString, IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateRepaymentDto {
    @IsUUID()
    loanId: string;

    @IsNumber()
    @IsPositive()
    amount: number;
}
