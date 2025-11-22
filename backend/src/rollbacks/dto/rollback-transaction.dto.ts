import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class RollbackTransactionDto {
    @IsString()
    @IsUUID()
    transactionId: string;

    @IsString()
    @IsNotEmpty()
    reason: string;
}
