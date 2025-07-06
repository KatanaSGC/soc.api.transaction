import { Command, CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { GeneratePaymentCommand } from "src/command/transactionPayment/generatePayment.command";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionPaymentEntity } from "src/entities/transactionPayment.entity";
import { TransactionPaymentStateEntity } from "src/entities/transactionPaymentState.entity";
import { StripeService } from "src/services/stripe.service";
import { Repository } from "typeorm";

@CommandHandler(GeneratePaymentCommand)
export class GeneratePaymentHandler implements ICommandHandler<GeneratePaymentCommand> {
    constructor(
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(TransactionPaymentEntity)
        private readonly transactionPaymentRepository: Repository<TransactionPaymentEntity>,
        @InjectRepository(TransactionPaymentStateEntity)
        private readonly transactionPaymentStateRepository: Repository<TransactionPaymentStateEntity>,
        private readonly stripeService: StripeService,
    ) { }

    async execute(command: GeneratePaymentCommand): Promise<ApiResponse<{ paymentUrl: string; paymentId: string }>> {
        try {
            const findTransaction = await this.transactionRepository.findOneBy({
                TransactionCode: command.TransactionCode
            });

            if (!findTransaction) {
                return {
                    status: ResponseCode.ERROR,
                    message: "Transaction not found.",
                    data: null,
                    error: "Transaction with the provided code does not exist."
                };
            }

            const findTransactionPayment = await this.transactionPaymentRepository.findOneBy({
                TransactionId: findTransaction.Id,
                PaymentStatus: 'pending'
            });
            if (findTransactionPayment) {
                return {
                    status: ResponseCode.SUCCESS,
                    message: "Payment link already exists.",
                    data: {
                        paymentUrl: findTransactionPayment.PaymentUrl,
                        paymentId: findTransactionPayment.StripePaymentLinkId
                    },
                    error: null
                };
            }

            const amount = findTransaction.AmountOffered;
            const currency = "hnl";
            const description = `Pago de transacción ${findTransaction.TransactionCode}`;

            const paymentLink = await this.stripeService.createPaymentLink(
                amount,
                currency,
                description,
                findTransaction.TransactionCode
            );

            const transactionState = await this.transactionPaymentStateRepository.findOneBy({
                TransactionPaymentStateCode: 'TPS-01'
            })

            const transactionPayment = new TransactionPaymentEntity();
            transactionPayment.TransactionId = findTransaction.Id;
            transactionPayment.TransactionUnlockCode = this.generateRandomCode(32);
            transactionPayment.TransactionSecurityCode = this.generateRandomCode(32);
            transactionPayment.TransactionPaymentStateId = transactionState?.Id || 0;
            transactionPayment.IsStripePayment = true;
            transactionPayment.StripePaymentLinkId = paymentLink.id;
            transactionPayment.PaymentUrl = paymentLink.url;
            transactionPayment.PaymentStatus = 'pending';


            await this.transactionPaymentRepository.save(transactionPayment);

            return {
                status: ResponseCode.SUCCESS,
                message: "Payment link generated successfully.",
                data: {
                    paymentUrl: paymentLink.url,
                    paymentId: paymentLink.id
                },
                error: null
            };

        } catch (error) {
            return {
                status: ResponseCode.EXCEPTION,
                message: `Error generating payment: ${error.message}`,
                data: null,
                error: error.message
            };
        }
    }

    private generateRandomCode(length: number): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }
}