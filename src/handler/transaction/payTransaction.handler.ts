import { Inject } from "@nestjs/common";
import { CommandHandler, ICommand, ICommandHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { PayTransactionCommand } from "src/command/transaction/payTransaction.command";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionPaymentEntity } from "src/entities/transactionPayment.entity";
import { TransactionPaymentStateEntity } from "src/entities/transactionPaymentState.entity";
import { TransactionStateEntity } from "src/entities/transactionState.entity";
import { StripeService } from "src/services/stripe.service";
import { Repository } from "typeorm";

@CommandHandler(PayTransactionCommand)
export class PayTransactionHandler implements ICommandHandler<PayTransactionCommand> {
    constructor(
        private readonly stripeService: StripeService,
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(TransactionStateEntity)
        private readonly transactionStateRepository: Repository<TransactionStateEntity>,
        @InjectRepository(TransactionPaymentEntity)
        private readonly transactionPaymentRepository: Repository<TransactionPaymentEntity>,
        @InjectRepository(TransactionPaymentStateEntity)
        private readonly transactionPaymentStateRepository: Repository<TransactionPaymentStateEntity>,            
    ) {}

    async execute(command: PayTransactionCommand): Promise<ApiResponse<boolean>> {
        const response = new ApiResponse<boolean>();

        const findTransaction = await this.transactionRepository.findOneBy( {
            TransactionCode: command.TransactionCode
        });
        if(!findTransaction) {
            response.data = false;
            response.message = "No se encontro la transaccion, verifique el codigo de transaccion.";
            response.status = ResponseCode.ERROR;
            return response;
        }        

        const findTransactionPayment = await this.transactionPaymentRepository.findOneBy({
            TransactionCode: command.TransactionCode      
        });
        if (!findTransactionPayment) {
            response.data = false;
            response.message = "No se ha generado un pago para esta transaccion.";
            response.status = ResponseCode.ERROR;
            return response;
        }

        const result = await this.stripeService.checkPaymentStatus(findTransactionPayment.StripePaymentLinkId);
        if (!result) {
            response.data = false;
            response.message = "El pago no se ha completado o no existe.";
            response.status = ResponseCode.ERROR;
            return response;
        }

        if(result.status !== 'completed') {
            response.data = false;
            response.message = "El pago no se ha completado correctamente.";
            response.status = ResponseCode.ERROR;
            return response;
        }

        const findTransactionPaymentState = await this.transactionPaymentStateRepository.findOneBy({
            Id: findTransactionPayment.TransactionPaymentStateId,        
        });
        if(findTransactionPaymentState!.TransactionPaymentStateCode !== 'TPS-01') {
            response.data = false;
            response.message = "La transaccion ya ha sido pagada.";
            response.status = ResponseCode.ERROR;
            return response;
        }

        const findTransactionState = await this.transactionPaymentStateRepository.findOneBy({
            TransactionPaymentStateCode: 'TPS-02'
        });

        findTransactionPayment.TransactionPaymentStateId = findTransactionState!.Id;     
        findTransactionPayment.StripePaymentIntentId = result.paymentIntentId || '';   
        
        await this.transactionPaymentRepository.save(findTransactionPayment);

        const findFlowTransaction = await this.transactionRepository.findBy({
            TransactionCode: findTransaction.TransactionCode
        });

        const findTransactionStatePayment = await this.transactionStateRepository.findOneBy({
            TransactionStateCode: 'TS-02'
        });

        const buyTransaction = findFlowTransaction.find(t => t.IsBuyTransaction === true);
        const sellTransaction = findFlowTransaction.find(t => t.IsBuyTransaction === false);

        buyTransaction!.Id = 0;
        buyTransaction!.TransactionStateId = findTransactionStatePayment!.Id;

        sellTransaction!.Id = 0;
        sellTransaction!.TransactionStateId = findTransactionStatePayment!.Id;

        await this.transactionRepository.save(buyTransaction!);
        await this.transactionRepository.save(sellTransaction!);
        
        response.data = true;
        response.message = "Transaccion pagada.";
        response.status = ResponseCode.SUCCESS;
        return response;
    }
}