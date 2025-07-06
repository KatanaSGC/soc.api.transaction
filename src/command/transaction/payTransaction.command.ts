import { IsNotEmpty } from "class-validator";

export class PayTransactionCommand 
{
    @IsNotEmpty()
    TransactionCode: string;    

    @IsNotEmpty()
    TransactionSecurityCode: string;
}