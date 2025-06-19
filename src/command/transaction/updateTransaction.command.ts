import { IsNotEmpty, IsNumber, Min } from "class-validator";

export class UpdateTransactionCommand {
    @IsNotEmpty()
    Username: string;

    @IsNotEmpty()
    TransactionCode: string;

    @IsNumber()
    @Min(1)
    AmountOffered: number;

    @IsNumber()
    @Min(1)
    ProductUnits: number;
}