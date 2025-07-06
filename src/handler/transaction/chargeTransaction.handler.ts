// src/handler/transaction/payToSeller.handler.ts
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionPaymentEntity } from "src/entities/transactionPayment.entity";
import { TransactionPaymentStateEntity } from "src/entities/transactionPaymentState.entity";
import { ProfileEntity } from "src/entities/profile.entity";
import { ProfileStripeAccountEntity } from "src/entities/profileStripeAccount.entity";
import { StripeService } from "src/services/stripe.service";
import { Repository } from "typeorm";
import { ChargeTransaccionCommand } from "src/command/transaction/chargeTransaction.command";

@CommandHandler(ChargeTransaccionCommand)
export class ChargeTransaccionHandler implements ICommandHandler<ChargeTransaccionCommand> {
    private readonly PLATFORM_COMMISSION_PERCENTAGE = 0.06;

    constructor(
        private readonly stripeService: StripeService,
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(TransactionPaymentEntity)
        private readonly transactionPaymentRepository: Repository<TransactionPaymentEntity>,
        @InjectRepository(TransactionPaymentStateEntity)
        private readonly transactionPaymentStateRepository: Repository<TransactionPaymentStateEntity>,
        @InjectRepository(ProfileEntity, 'profiles')
        private readonly profileRepository: Repository<ProfileEntity>,
        @InjectRepository(ProfileStripeAccountEntity, 'profiles')
        private readonly profileStripeAccountRepository: Repository<ProfileStripeAccountEntity>,
    ) { }

    async execute(command: ChargeTransaccionCommand): Promise<ApiResponse<boolean>> {
        let response = new ApiResponse<boolean>();
        response.data = false;
        response.status = ResponseCode.ERROR;

        try {
            const findTransaction = await this.transactionRepository.findOneBy({
                TransactionCode: command.TransactionCode
            });

            if (!findTransaction) {
                response.message = "No se encontró la transacción, verifique el código de transacción.";
                return response;
            }

            const findTransactionPayment = await this.transactionPaymentRepository.findOneBy({
                TransactionId: findTransaction.Id,
            });

            if (!findTransactionPayment) {
                response.message = "No se ha encontrado un pago para esta transacción.";
                return response;
            }

            const findTransactionPaymentState = await this.transactionPaymentStateRepository.findOneBy({
                Id: findTransactionPayment.TransactionPaymentStateId,
            });

            if (findTransactionPaymentState?.TransactionPaymentStateCode !== 'TPS-02') {
                response.message = "El pago no está en estado completado para poder transferir al vendedor.";
                return response;
            }

            if (findTransactionPayment.PaymentStatus === 'transferred_to_seller') {
                response.message = "Ya se ha transferido el pago al vendedor para esta transacción.";
                return response;
            }

            const sellerProfile = await this.profileRepository.findOneBy({
                Identify: findTransaction.SellerUsername
            });

            if (!sellerProfile) {
                response.message = "No se encontró el perfil del vendedor.";
                return response;
            }

            const sellerStripeAccount = await this.profileStripeAccountRepository.findOneBy({
                ProfileId: sellerProfile.Id
            });

            if (!sellerStripeAccount) {
                response.data = null;
                response.message = "El vendedor no tiene una cuenta de Stripe configurada.";
                response.status = ResponseCode.ERROR;
                return response;
            }

            const paymentCalculation = this.calculateSellerPayment(findTransaction.AmountOffered);
            const transfer = await this.stripeService.createTransfer(
                paymentCalculation.sellerAmount,
                'hnl',
                sellerStripeAccount.StripeAccountId,
                `Pago por transacción ${findTransaction.TransactionCode} - Comisión plataforma: ${this.PLATFORM_COMMISSION_PERCENTAGE * 100}%`, `transaction_${findTransaction.TransactionCode}`
            );

            const transferValidation = await this.validateTransferStatus(transfer);
            if (!transferValidation.isSuccessful) {
                response.message = `Error en la transferencia: ${transferValidation.errorMessage}`;
                return response;
            }

            const findTransactionPaymentStateCompleted = await this.transactionPaymentStateRepository.findOneBy({
                TransactionPaymentStateCode: 'TPS-03'
            });
            if (!findTransactionPaymentStateCompleted) {
                response.message = "No se encontró el estado de pago completado.";
                return response;
            }

            findTransactionPayment.TransactionPaymentStateId = findTransactionPaymentStateCompleted.Id;
            await this.transactionPaymentRepository.save(findTransactionPayment);

            response.data = true;
            response.message = `Pago transferido exitosamente al vendedor. Monto: ${paymentCalculation.sellerAmount.toFixed(2)} HNL (Comisión plataforma: ${paymentCalculation.platformCommission.toFixed(2)} HNL)`;
            response.status = ResponseCode.SUCCESS;
            return response;

        } catch (error) {
            console.error('PayToSellerHandler Error:', {
                transactionCode: command.TransactionCode,
                error: error.message,
                stack: error.stack
            });

            response.message = `Error al transferir pago al vendedor: ${error.message}`;
            response.status = ResponseCode.EXCEPTION;
            response.error = error.message;
            return response;
        }
    }

    private calculateSellerPayment(originalAmount: number): {
        originalAmount: number;
        platformCommission: number;
        sellerAmount: number;
        commissionPercentage: number;
    } {
        const platformCommission = originalAmount * this.PLATFORM_COMMISSION_PERCENTAGE;
        const sellerAmount = originalAmount - platformCommission;

        return {
            originalAmount: originalAmount,
            platformCommission: Math.round(platformCommission * 100) / 100,
            sellerAmount: Math.round(sellerAmount * 100) / 100,
            commissionPercentage: this.PLATFORM_COMMISSION_PERCENTAGE
        };
    }

    private async validateTransferStatus(transfer: any): Promise<{
        isSuccessful: boolean;
        errorMessage?: string;
        shouldRetry?: boolean;
    }> {
        const successfulStatuses = ['paid', 'pending']; 

        const failedStatuses = ['failed', 'canceled'];

        if (successfulStatuses.includes(transfer.status)) {
            return { isSuccessful: true };
        }

        if (failedStatuses.includes(transfer.status)) {
            return {
                isSuccessful: false,
                errorMessage: `La transferencia falló con estado: ${transfer.status}`,
                shouldRetry: false
            };
        }

        return {
            isSuccessful: false,
            errorMessage: `Estado de transferencia desconocido: ${transfer.status}`,
            shouldRetry: false
        };
    }

    async getPaymentSummary(transactionCode: string): Promise<{
        originalAmount: number;
        platformCommission: number;
        sellerAmount: number;
        commissionPercentage: number;
    } | null> {
        const findTransaction = await this.transactionRepository.findOneBy({
            TransactionCode: transactionCode
        });

        if (!findTransaction) {
            return null;
        }

        return this.calculateSellerPayment(findTransaction.AmountOffered);
    }
}