import { Body, Controller, Post, Headers, HttpCode, HttpStatus, Param, Get, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GeneratePaymentCommand } from 'src/command/transactionPayment/generatePayment.command';
import { UpdatePaymentStatusCommand } from 'src/command/transactionPayment/updatePaymentStatus.command';
import { GetPaymentStatusQuery } from 'src/query/transactionPayment/getPaymentStatus.query';
import { StripeService } from 'src/services/stripe.service';
import { ApiResponse } from 'src/common/response/apiResponse.dto';
import { ResponseCode } from 'src/common/response/responseCode';
import { PayTransactionCommand } from 'src/command/transaction/payTransaction.command';

@Controller('transactions/payment')
export class PaymentController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly stripeService: StripeService,
    ) {}

    @Get('success')
    async successfulPayment(@Query("transaction") transaction: string): Promise<ApiResponse<boolean>> {
        return await this.commandBus.execute(new PayTransactionCommand(transaction));
    }

    @Post('generate')
    @HttpCode(HttpStatus.CREATED)
    async generatePayment(@Body() generatePaymentCommand: GeneratePaymentCommand): Promise<ApiResponse<{ paymentUrl: string; paymentId: string }>> {
        return await this.commandBus.execute(generatePaymentCommand);
    }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async handleStripeWebhook(
        @Body() body: any,
        @Headers('stripe-signature') signature: string,
    ): Promise<{ received: boolean }> {
        try {
            const event = await this.stripeService.constructWebhookEvent(
                JSON.stringify(body),
                signature,
            );

            switch (event.type) {
                case 'checkout.session.completed':
                    await this.handleCheckoutSessionCompleted(event.data.object);
                    break;
                case 'payment_intent.succeeded':
                    await this.handlePaymentIntentSucceeded(event.data.object);
                    break;
                case 'payment_intent.payment_failed':
                    await this.handlePaymentIntentFailed(event.data.object);
                    break;
                default:
                    console.log(`Unhandled event type: ${event.type}`);
            }

            return { received: true };
        } catch (error) {
            console.error('Webhook error:', error.message);
            throw error;
        }
    }

    @Get('status/:transactionCode')
    async getPaymentStatus(@Param('transactionCode') transactionCode: string): Promise<ApiResponse<{ status: string; paymentUrl?: string; paymentId?: string }>> {
        const query = new GetPaymentStatusQuery(transactionCode);
        return await this.queryBus.execute(query);
    }

    private async handleCheckoutSessionCompleted(session: any): Promise<void> {
        console.log('Checkout session completed:', session.id);
        
        const transactionCode = session.metadata?.transactionCode;
        if (transactionCode) {
            const command = new UpdatePaymentStatusCommand(
                transactionCode,
                'completed',
                session.payment_intent
            );
            await this.commandBus.execute(command);
        }
    }

    private async handlePaymentIntentSucceeded(paymentIntent: any): Promise<void> {
        console.log('Payment intent succeeded:', paymentIntent.id);
        
        const transactionCode = paymentIntent.metadata?.transactionCode;
        if (transactionCode) {
            const command = new UpdatePaymentStatusCommand(
                transactionCode,
                'completed',
                paymentIntent.id
            );
            await this.commandBus.execute(command);
        }
    }

    private async handlePaymentIntentFailed(paymentIntent: any): Promise<void> {
        console.log('Payment intent failed:', paymentIntent.id);
        
        const transactionCode = paymentIntent.metadata?.transactionCode;
        if (transactionCode) {
            const command = new UpdatePaymentStatusCommand(
                transactionCode,
                'failed',
                paymentIntent.id
            );
            await this.commandBus.execute(command);
        }
    }
}
