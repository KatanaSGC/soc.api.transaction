import { IsNotEmpty } from "class-validator";

export class GenerateTransactionCommand
{
    @IsNotEmpty()
    BuyerUsername: string;
}