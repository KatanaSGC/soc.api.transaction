import { Command, CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { CompleteTransactionCommand } from "src/command/transaction/completeTransaction.comand";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionPaymentEntity } from "src/entities/transactionPayment.entity";
import { TransactionPaymentStateEntity } from "src/entities/transactionPaymentState.entity";
import { TransactionStateEntity } from "src/entities/transactionState.entity";
import { In, Repository } from "typeorm";

@CommandHandler(CompleteTransactionCommand)
export class CompleteTransactionHandler implements ICommandHandler<CompleteTransactionCommand> {
    constructor(
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(TransactionPaymentEntity)
        private readonly transactionPaymentRepository: Repository<TransactionPaymentEntity>,
        @InjectRepository(TransactionStateEntity)
        private readonly transactionStateRepository: Repository<TransactionStateEntity>,
        @InjectRepository(TransactionPaymentStateEntity)        
        private readonly transactionPaymentStateRepository: Repository<TransactionPaymentStateEntity>
    ) {}

    async execute(command: CompleteTransactionCommand): Promise<ApiResponse<boolean>> {
        const response = new ApiResponse<boolean>();

        const findTransaction = await this.transactionRepository.findOneBy({
            TransactionCode: command.TransactionCode
        });
        if (!findTransaction) {
            response.status = ResponseCode.ERROR;
            response.message = "Transacción no encontrada.";
            response.data = null;
            return response;
        }

        const findTransactionState = await this.transactionStateRepository.findOneBy({
            TransactionStateCode: 'TS-02'
        });    

        if (findTransaction.TransactionStateId !== findTransactionState?.Id) {
            response.status = ResponseCode.ERROR;
            response.message = "La transacción no se encuentra en estado pendiente.";
            response.data = null;
            return response;
        }

        const findTransactionPayment = await this.transactionPaymentRepository.findOne({
            where: {
                TransactionCode: command.TransactionCode
            },
            order: {
                CreatedAt: "DESC"
            }
        });
        if(!findTransactionPayment) {
            response.status = ResponseCode.ERROR;
            response.message = "No se encontro información de pago para la transacción.";
            response.data = null;   
        }

        if(findTransactionPayment!.TransactionUnlockCode !== command.TransactionUnlockCode) {
            response.status = ResponseCode.ERROR;
            response.message = "El código de desbloqueo de la transacción no es correcto.";
            response.data = null;
            return response;
        }

        const nextTransactionState = await this.transactionStateRepository.findOne({
            where: {
                TransactionStateCode: 'TS-03'
            }
        });

        const sellTransaction = findTransaction;
        const buyTransaction = findTransaction;

        sellTransaction.TransactionStateId = 0;
        buyTransaction.TransactionStateId = 0;
        sellTransaction.IsBuyTransaction = false;
        buyTransaction.IsBuyTransaction = true;
        sellTransaction.CreatedAt = new Date();
        buyTransaction.CreatedAt = new Date();

        sellTransaction.TransactionStateId = nextTransactionState!.Id;
        buyTransaction.TransactionStateId = nextTransactionState!.Id;

        await this.transactionRepository.save(sellTransaction);
        await this.transactionRepository.save(buyTransaction);

        response.status = ResponseCode.SUCCESS;
        response.message = "Transacción completada correctamente.";
        response.data = true;

        return response;
    }
}