// src/handler/transaction/refundPayment.handler.ts
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { RefundTransactionCommand } from "src/command/transaction/refundTransaction.command";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionPaymentEntity } from "src/entities/transactionPayment.entity";
import { TransactionPaymentStateEntity } from "src/entities/transactionPaymentState.entity";
import { StripeService } from "src/services/stripe.service";
import { Repository } from "typeorm";

@CommandHandler(RefundTransactionCommand)
export class RefundPaymentHandler implements ICommandHandler<RefundTransactionCommand> {
    private readonly PLATFORM_FEE_PERCENTAGE = 0.06; // 6%

    constructor(
        private readonly stripeService: StripeService,
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(TransactionPaymentEntity)
        private readonly transactionPaymentRepository: Repository<TransactionPaymentEntity>,
        @InjectRepository(TransactionPaymentStateEntity)
        private readonly transactionPaymentStateRepository: Repository<TransactionPaymentStateEntity>,
    ) { }

    async execute(command: RefundTransactionCommand): Promise<ApiResponse<boolean>> {
        let response = new ApiResponse<boolean>();
        response.status = ResponseCode.ERROR;
        response.data = false;

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
                response.message = "El pago no está en estado completado para poder realizar el reembolso.";
                return response;
            }

            if (!findTransactionPayment.StripePaymentIntentId) {
                response.message = "No se encontró el ID del PaymentIntent de Stripe para realizar el reembolso.";
                return response;
            }

            const originalAmount = findTransaction.AmountOffered;
            const refundCalculation = this.calculateRefundAmount(originalAmount);

            const refund = await this.stripeService.createRefund(
                findTransactionPayment.StripePaymentIntentId,
                refundCalculation.refundAmount,
                `${command.Reason} - Comisión plataforma: 6%`
            );
            const refundValidation = await this.validateRefundStatus(refund);
            
            if (!refundValidation.isSuccessful) {
                response.data = false;        
                response.message = `Error en el reembolso: ${refundValidation.errorMessage}. Estado: ${refund.status}`;
                response.status = ResponseCode.ERROR;
                return response;
            }

            const refundedState = await this.transactionPaymentStateRepository.findOneBy({
                TransactionPaymentStateCode: 'TPS-04'
            });

            findTransactionPayment.TransactionPaymentStateId = refundedState!.Id;
            await this.transactionPaymentRepository.save(findTransactionPayment);

            response.data = true;
            response.message = "Reembolso procesado exitosamente.";
            response.status = ResponseCode.SUCCESS;
            return response;

        } catch (error) {
            response.data = false;
            response.message = `Error al procesar el reembolso: ${error.message}`;
            response.status = ResponseCode.EXCEPTION;
            response.error = error.message;
            return response;
        }
    }

    private calculateRefundAmount(originalAmount: number): {
        originalAmount: number;
        platformFee: number;
        refundAmount: number;
        feePercentage: number;
    } {
        const platformFee = originalAmount * this.PLATFORM_FEE_PERCENTAGE;
        const refundAmount = originalAmount - platformFee;

        return {
            originalAmount: originalAmount,
            platformFee: Math.round(platformFee * 100) / 100, // Redondear a 2 decimales
            refundAmount: Math.round(refundAmount * 100) / 100, // Redondear a 2 decimales
            feePercentage: this.PLATFORM_FEE_PERCENTAGE
        };
    }

        private async validateRefundStatus(refund: any): Promise<{
        isSuccessful: boolean;
        errorMessage?: string;
        shouldRetry?: boolean;
    }> {
        // Estados exitosos en Stripe
        const successfulStatuses = ['succeeded'];
        
        // Estados pendientes (podrían completarse después)
        const pendingStatuses = ['pending'];
        
        // Estados de fallo
        const failedStatuses = ['failed', 'canceled'];

        if (successfulStatuses.includes(refund.status)) {
            return { isSuccessful: true };
        }

        if (pendingStatuses.includes(refund.status)) {
            // Para estados pendientes, podrías implementar lógica adicional
            // como verificar después de un tiempo o marcar como pendiente
            return {
                isSuccessful: false,
                errorMessage: 'El reembolso está pendiente de procesamiento. Se completará en las próximas horas.',
                shouldRetry: true
            };
        }

        if (failedStatuses.includes(refund.status)) {
            return {
                isSuccessful: false,
                errorMessage: `El reembolso falló con estado: ${refund.status}`,
                shouldRetry: false
            };
        }

        // Estado desconocido
        return {
            isSuccessful: false,
            errorMessage: `Estado de reembolso desconocido: ${refund.status}`,
            shouldRetry: false
        };
    }

    /**
     * Verifica el estado actual de un refund en Stripe
     */
    private async verifyRefundWithStripe(refundId: string): Promise<{
        isSuccessful: boolean;
        currentStatus: string;
        errorMessage?: string;
    }> {
        try {
            const refund = await this.stripeService.retrieveRefund(refundId);
            const validation = await this.validateRefundStatus(refund);
            
            return {
                isSuccessful: validation.isSuccessful,
                currentStatus: refund.status!,
                errorMessage: validation.errorMessage
            };
        } catch (error) {
            return {
                isSuccessful: false,
                currentStatus: 'unknown',
                errorMessage: `Error verificando refund: ${error.message}`
            };
        }
    }
}