import { IsNotEmpty, IsNumber, Length, Min } from "class-validator";

export class CreateTransactionCommand {
    @IsNotEmpty()
    SellerUsername: string;
    
    @IsNotEmpty()
    BuyerUsername: string;

    @IsNumber()
    @Min(1)
    ProfileProductId: number;

    @IsNumber()
    @Min(1)
    ProductUnits: number;
}