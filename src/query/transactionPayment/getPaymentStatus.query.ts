import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionPaymentEntity } from 'src/entities/transactionPayment.entity';
import { ApiResponse } from 'src/common/response/apiResponse.dto';
import { ResponseCode } from 'src/common/response/responseCode';

export class GetPaymentStatusQuery {
    constructor(public readonly transactionCode: string) {}
}

@QueryHandler(GetPaymentStatusQuery)
export class GetPaymentStatusHandler implements IQueryHandler<GetPaymentStatusQuery> {
    constructor(
        @InjectRepository(TransactionPaymentEntity)
        private readonly transactionPaymentRepository: Repository<TransactionPaymentEntity>,
    ) {}

    async execute(query: GetPaymentStatusQuery): Promise<ApiResponse<{  paymentUrl?: string; paymentId?: string }>> {
        try {
            // Buscar el pago por código de transacción
            const payment = await this.transactionPaymentRepository
                .createQueryBuilder('payment')
                .innerJoin('TransactionEntity', 'transaction', 'transaction.Id = payment.TransactionId')
                .where('transaction.TransactionCode = :transactionCode', { transactionCode: query.transactionCode })
                .andWhere('payment.IsActive = :isActive', { isActive: true })
                .getOne();

            if (!payment) {
                return {
                    status: ResponseCode.ERROR,
                    message: 'Payment not found for the given transaction code.',
                    data: null,
                    error: 'No payment record found'
                };
            }

            return {
                status: ResponseCode.SUCCESS,
                message: 'Payment status retrieved successfully.',
                data: {
                    paymentUrl: payment.PaymentUrl,
                    paymentId: payment.StripePaymentLinkId || payment.StripeCheckoutSessionId
                },
                error: null
            };

        } catch (error) {
            return {
                status: ResponseCode.EXCEPTION,
                message: 'Error retrieving payment status.',
                data: null,
                error: error.message
            };
        }
    }
}
