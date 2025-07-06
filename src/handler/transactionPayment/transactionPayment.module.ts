import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionPaymentEntity } from "src/entities/transactionPayment.entity";
import { GeneratePaymentHandler } from "./generatePayment.handler";
import { StripeService } from "src/services/stripe.service";
import { GetPaymentStatusHandler } from "src/query/transactionPayment/getPaymentStatus.query";
import { UpdatePaymentStatusHandler } from "src/command/transactionPayment/updatePaymentStatus.command";
import { TransactionPaymentStateEntity } from "src/entities/transactionPaymentState.entity";

@Module({
    imports: [
        CqrsModule,
        ConfigModule,
        TypeOrmModule.forFeature([
            TransactionEntity,
            TransactionPaymentEntity,
            TransactionPaymentStateEntity
        ]),
    ],
    providers: [
        StripeService,
        GeneratePaymentHandler,
        GetPaymentStatusHandler,
        UpdatePaymentStatusHandler
    ],
    exports: [
        StripeService,
        GeneratePaymentHandler,
        GetPaymentStatusHandler,
        UpdatePaymentStatusHandler
    ]
})
export class TransactionPaymentModule { }
