import { IsNotEmpty } from "class-validator";

export class GeneratePaymentCommand 
{
    @IsNotEmpty()
    TransactionCode: string;
    
    Amount: number;
}