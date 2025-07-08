import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { UpdateTransactionCommand } from "src/command/transaction/updateTransaction.command";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionDecisionEntity } from "src/entities/transactionDecision.entity";
import { Repository } from "typeorm";

let transaction: TransactionEntity | null = null;
let transactionVersion: number = 0;

@CommandHandler(UpdateTransactionCommand)
export class UpdateTransactionHandler implements ICommandHandler<UpdateTransactionCommand> {

    constructor(
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(TransactionDecisionEntity)
        private readonly transactionDecisionRepository: Repository<TransactionDecisionEntity>
    ) { }

    async execute(command: UpdateTransactionCommand): Promise<ApiResponse<boolean>> {
        const response = new ApiResponse<boolean>();

        const [isValid, message] = await this.validateTransaction(command);
        if (!isValid) {
            response.status = ResponseCode.ERROR;
            response.data = false;
            response.message = message;
            return response;
        }

        const createTransaction = new TransactionEntity();
        createTransaction.TransactionCode = transaction!.TransactionCode;
        createTransaction.BuyerUsername = transaction!.BuyerUsername;
        createTransaction.SellerUsername = transaction!.SellerUsername;
        createTransaction.ProductDescription = transaction!.ProductDescription;
        createTransaction.TransactionStateId = transaction!.TransactionStateId;
        createTransaction.ProductUnits = command.ProductUnits
        createTransaction.AmountOffered = command.AmountOffered;

        await this.transactionRepository.save(createTransaction);

        await this.createTransactionDecision(command.Username);

        response.status = ResponseCode.SUCCESS;
        response.data = true;
        response.message = "Transacción actualizada.";
        return response;
    }

    private async validateTransaction(command: UpdateTransactionCommand): Promise<[boolean, string]> {
        transaction = await this.transactionRepository.findOneBy({ TransactionCode: command.TransactionCode })
        if (!transaction) {
            return [false, 'Transacción no encontrada.'];
        }

        transactionVersion = await this.transactionRepository.countBy({ TransactionCode: transaction.TransactionCode });

        const lastDecision = await this.transactionDecisionRepository.findOne({
            where: { TransactionId: transaction!.Id, Version: transactionVersion },
            order: { CreatedAt: 'DESC' },
        });

        if(lastDecision?.Username === command.Username) {
            return [false, 'Ya has enviado una oferta para esta transacción.'];
        }

        return [true, 'Ok'];
    }

    private async createTransactionDecision(username: string) {

        const transactionDecision = new TransactionDecisionEntity();
        transactionDecision.TransactionId = transaction!.Id;
        transactionDecision.Username = username;
        transactionDecision.IsAccepted = false;
        transactionDecision.Version = transactionVersion;

        await this.transactionDecisionRepository.save(transactionDecision);
        
        const otherTransactionDecision = new TransactionDecisionEntity();
        otherTransactionDecision.TransactionId = transaction!.Id;
        otherTransactionDecision.Username = username;
        otherTransactionDecision.IsAccepted = true;
        otherTransactionDecision.Version = transactionVersion + 1;

        await this.transactionDecisionRepository.save(otherTransactionDecision);
    }
} 