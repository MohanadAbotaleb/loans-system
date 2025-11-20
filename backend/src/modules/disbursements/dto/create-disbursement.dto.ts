import { IsString, IsNumber, IsPositive, Min, IsUUID } from 'class-validator';

export class CreateDisbursementDto {
    @IsUUID()
    loanId: string;

    @IsUUID()
    borrowerId: string;

    @IsNumber()
    @IsPositive()
    amount: number;

    @IsString()
    currency: string;

    @IsNumber()
    @Min(1)
    tenor: number; // months

    @IsNumber()
    @IsPositive()
    interestRate: number; // annual percentage
}
