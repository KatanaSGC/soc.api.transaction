import { IsNotEmpty } from 'class-validator';

export class ConfirmTransactionCommand {
  @IsNotEmpty()
  TransactionCode: string;
}
