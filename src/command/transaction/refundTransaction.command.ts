// src/command/transaction/refundPayment.command.ts
import { IsNotEmpty } from "class-validator";

export class RefundTransactionCommand {
    @IsNotEmpty()
    TransactionCode: string;

    @IsNotEmpty()
    Reason: string;
}