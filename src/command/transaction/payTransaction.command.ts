import { IsNotEmpty } from "class-validator";

export class PayTransactionCommand 
{
    @IsNotEmpty()
    TransactionCode: string;    

    constructor(
        transactionCode: string,
    ) {
        this.TransactionCode = transactionCode;
    }
}