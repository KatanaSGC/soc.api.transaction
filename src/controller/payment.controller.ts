import { Body, Controller, Post, Headers, HttpCode, HttpStatus, Param, Get, Query, Render } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GeneratePaymentCommand } from 'src/command/transactionPayment/generatePayment.command';
import { UpdatePaymentStatusCommand } from 'src/command/transactionPayment/updatePaymentStatus.command';
import { GetPaymentStatusQuery } from 'src/query/transactionPayment/getPaymentStatus.query';
import { StripeService } from 'src/services/stripe.service';
import { ApiResponse } from 'src/common/response/apiResponse.dto';
import { ResponseCode } from 'src/common/response/responseCode';
import { PayTransactionCommand } from 'src/command/transaction/payTransaction.command';
import { log } from 'console';

@Controller('transactions/payment')
export class PaymentController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
        private readonly stripeService: StripeService,
    ) { }

    @Get()
    @Render('index')
    getHello() {
        return {
            name: 'Juan',
            date: new Date().toLocaleDateString('es-ES')
        };
    }

    @Get('/success/:transactionCode')
    @Render('index')
    async successfulPayment(@Param('transactionCode') transactionCode: string) {
        const send = await this.commandBus.execute(new PayTransactionCommand(transactionCode));

        return {
            transactionCode: transactionCode,
            date: new Date().toLocaleDateString('es-ES'),
            logo: '/static/organicoLogoBlanco.png',
        };
    }

    @Post('generate')
    @HttpCode(HttpStatus.CREATED)
    async generatePayment(@Body() generatePaymentCommand: GeneratePaymentCommand): Promise<ApiResponse<{ paymentUrl: string; paymentId: string }>> {
        return await this.commandBus.execute(generatePaymentCommand);
    }
}
