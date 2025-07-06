import { IsNotEmpty } from "class-validator";

export class ChargeTransaccionCommand {
    @IsNotEmpty()
    TransactionCode: string;
}