import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfirmTransactionCommand } from "src/command/transaction/confirmTransaction.command";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionDecisionEntity } from "src/entities/transactionDecision.entity";
import { TransactionStateEntity } from "src/entities/transactionState.entity";
import { Repository } from "typeorm";

let transaction: TransactionEntity | null = null;
let version: number = 0;
let transactionState: TransactionStateEntity | null = null;

@CommandHandler(ConfirmTransactionCommand)
export class ConfirmTransactionHandler implements ICommandHandler<ConfirmTransactionCommand> {

    constructor(
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(TransactionStateEntity)
        private readonly transactionStateRepository: Repository<TransactionStateEntity>
    ) { }

    async execute(command: ConfirmTransactionCommand): Promise<ApiResponse<boolean>> {
        const response = new ApiResponse<boolean>();

        const [isValid, message] = await this.validateTransaction(command);
        if (!isValid) {
            response.status = ResponseCode.ERROR;
            response.data = false;
            response.message = message;
            return response;
        }

        await this.updateTransactionState();

        response.status = ResponseCode.SUCCESS;
        response.data = true;
        response.message = "Transacción confirmada.";
        return response;
    }

    private async validateTransaction(command: ConfirmTransactionCommand): Promise<[boolean, string]> {
        transaction = await this.transactionRepository.findOneBy({ TransactionCode: command.TransactionCode });
        if (!transaction) 
            return [false, 'Transacción no encontrada.'];

        transactionState = await this.transactionStateRepository.findOneBy({
            Id: transaction.TransactionStateId
        })

        if (transactionState?.TransactionStateCode === 'TS-02') 
            return [false, 'Transacción ya confirmada.'];

        version = await this.transactionRepository.countBy({
            TransactionCode: command.TransactionCode
        });

        return [true, 'Ok.'];
    }

    private async updateTransactionState(): Promise<void> {
        transaction!.TransactionStateId = transactionState!.Id;
        await this.transactionRepository.save(transaction!);
    }

}