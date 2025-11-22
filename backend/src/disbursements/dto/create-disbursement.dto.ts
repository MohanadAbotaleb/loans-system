import { IsString, IsNumber, IsPositive, IsUUID, Min, Max } from 'class-validator';

export class CreateDisbursementDto {
    @IsString()
    @IsUUID()
    loanId: string;

    @IsString()
    @IsUUID()
    borrowerId: string;

    @IsNumber()
    @IsPositive()
    amount: number;

    @IsString()
    currency: string;

    @IsNumber()
    @Min(1)
    tenor: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    interestRate: number;
}
