import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductEntity } from "src/entities/product.entity";
import { ProfileEntity } from "src/entities/profile.entity";
import { ProfileProductEntity } from "src/entities/profileProduct.entity";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionStateEntity } from "src/entities/transactionState.entity";
import { CreateTransactionHandler } from "./createTransaction.handler";
import { UpdateTransactionCommand } from "src/command/transaction/updateTransaction.command";
import { TransactionDecisionEntity } from "src/entities/transactionDecision.entity";
import { TransactionDetailView } from "src/entities/transactionDetailView.entity";
import { FindAllTransactionHandler } from "./findAllTransaction.handler";
import { UpdateTransactionHandler } from "./updateTransaction.handler";
import { ProfileProductPriceEntity } from "src/entities/profileProductPrice.entity";
import { GenerateTransactionHandler } from "./generateTransaction.handler";
import { ShoppingCartEntity } from "src/entities/shoppingCart.entity";
import { ShoppingCartDetailViewEntity } from "src/entities/shoppingCartDetailView.entity";
import { PayTransactionHandler } from "./payTransaction.handler";
import { TransactionPaymentStateEntity } from "src/entities/transactionPaymentState.entity";
import { TransactionPaymentEntity } from "src/entities/transactionPayment.entity";
import { StripeService } from "src/services/stripe.service";
import { CompleteTransactionHandler } from "./completeTransaction.handler";
import { MailServiceModule } from "src/services/mailer/mail.service.module";
import { MailService } from "src/services/mailer/mail.service";
import { MailerModule } from "@nestjs-modules/mailer";

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([
            TransactionEntity,
            TransactionStateEntity,
            TransactionDecisionEntity,
            TransactionDetailView,
            TransactionPaymentEntity,
            ShoppingCartEntity,
            ShoppingCartDetailViewEntity,
            TransactionPaymentStateEntity,
            MailServiceModule
        ]),
        TypeOrmModule.forFeature([
            ProfileEntity
        ], 'profiles'),
        TypeOrmModule.forFeature([
            ProfileProductEntity,
            ProductEntity,
            ProfileProductPriceEntity
        ], 'products'),
        MailServiceModule
    ],
    providers: [
        CreateTransactionHandler,
        UpdateTransactionHandler,
        FindAllTransactionHandler,
        GenerateTransactionHandler,
        PayTransactionHandler,
        StripeService,
        CompleteTransactionHandler,
    ],
    exports: [
        CreateTransactionHandler,
        UpdateTransactionHandler,
        FindAllTransactionHandler,
        GenerateTransactionHandler,
        PayTransactionHandler,
        StripeService,
        CompleteTransactionHandler,
    ]
})
export class TransactionModule { }