import { IsNotEmpty } from "class-validator";

export class CreateProfileStripeAccountCommand 
{
    @IsNotEmpty()    
    Identify: string;

    @IsNotEmpty()
    StripeEmail: string;

    @IsNotEmpty()
    StripeName: string;
}