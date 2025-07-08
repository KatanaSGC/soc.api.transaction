import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionPaymentEntity } from 'src/entities/transactionPayment.entity';
import { ApiResponse } from 'src/common/response/apiResponse.dto';
import { ResponseCode } from 'src/common/response/responseCode';

export class UpdatePaymentStatusCommand {
    constructor(
        public readonly transactionCode: string,
        public readonly status: string,
        public readonly stripePaymentIntentId?: string,
        public readonly stripeChargeId?: string
    ) {}
}

@CommandHandler(UpdatePaymentStatusCommand)
export class UpdatePaymentStatusHandler implements ICommandHandler<UpdatePaymentStatusCommand> {
    constructor(
        @InjectRepository(TransactionPaymentEntity)
        private readonly transactionPaymentRepository: Repository<TransactionPaymentEntity>,
    ) {}

    async execute(command: UpdatePaymentStatusCommand): Promise<ApiResponse<boolean>> {
        try {
            // Buscar el pago por código de transacción
            const payment = await this.transactionPaymentRepository
                .createQueryBuilder('payment')
                .innerJoin('TransactionEntity', 'transaction', 'transaction.Id = payment.TransactionId')
                .where('transaction.TransactionCode = :transactionCode', { transactionCode: command.transactionCode })
                .andWhere('payment.IsActive = :isActive', { isActive: true })
                .getOne();

            if (!payment) {
                return {
                    status: ResponseCode.ERROR,
                    message: 'Payment not found for the given transaction code.',
                    data: false,
                    error: 'No payment record found'
                };
            }


            await this.transactionPaymentRepository.save(payment);

            return {
                status: ResponseCode.SUCCESS,
                message: 'Payment status updated successfully.',
                data: true,
                error: null
            };

        } catch (error) {
            return {
                status: ResponseCode.EXCEPTION,
                message: 'Error updating payment status.',
                data: false,
                error: error.message
            };
        }
    }
}
