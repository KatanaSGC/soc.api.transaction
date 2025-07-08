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

@Module({
    imports: [
        CqrsModule,
        TypeOrmModule.forFeature([
            TransactionEntity,
            TransactionStateEntity,
            TransactionDecisionEntity,
            TransactionDetailView
        ]),
        TypeOrmModule.forFeature([
            ProfileEntity
        ], 'profiles'),
        TypeOrmModule.forFeature([
            ProfileProductEntity,
            ProductEntity,
            ProfileProductPriceEntity
        ], 'products'),
    ],
    providers: [
        CreateTransactionHandler,
        UpdateTransactionHandler,
        FindAllTransactionHandler
    ],
    exports: [
        CreateTransactionHandler,
        UpdateTransactionHandler,
        FindAllTransactionHandler
    ]
})
export class TransactionModule { }