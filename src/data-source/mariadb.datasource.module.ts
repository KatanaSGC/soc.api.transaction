import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProductEntity } from "src/entities/product.entity";
import { ProfileEntity } from "src/entities/profile.entity";
import { ProfileProductEntity } from "src/entities/profileProduct.entity";
import { ProfileProductPriceEntity } from "src/entities/profileProductPrice.entity";
import { ProfileStripeAccountEntity } from "src/entities/profileStripeAccount.entity";
import { ShoppingCartEntity } from "src/entities/shoppingCart.entity";
import { ShoppingCartDetailViewEntity } from "src/entities/shoppingCartDetailView.entity";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionDecisionEntity } from "src/entities/transactionDecision.entity";
import { TransactionDetailView } from "src/entities/transactionDetailView.entity";
import { TransactionPaymentDocumentEntity } from "src/entities/transactionDocument.entity";
import { TransactionPaymentEntity } from "src/entities/transactionPayment.entity";
import { TransactionPaymentMethodEntity } from "src/entities/transactionPaymentMethod.entity";
import { TransactionPaymentStateEntity } from "src/entities/transactionPaymentState.entity";
import { TransactionStateEntity } from "src/entities/transactionState.entity";
import { Transaction } from "typeorm";

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                type: 'mariadb',
                host: configService.get<string>('MARIADB_HOST'),
                port: configService.get<number>('MARIADB_PORT'),
                username: configService.get<string>('MARIADB_USERNAME'),
                password: configService.get<string>('MARIADB_PASSWORD'),
                database: configService.get<string>('MARIADB_NAME'),
                entities: [
                    TransactionEntity,
                    TransactionDecisionEntity,
                    TransactionPaymentEntity,
                    TransactionPaymentDocumentEntity,
                    TransactionPaymentMethodEntity,
                    TransactionPaymentStateEntity,
                    TransactionStateEntity,
                    TransactionDetailView,
                    ShoppingCartDetailViewEntity,
                    ShoppingCartEntity
                ],
                synchronize: false,
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forRootAsync({
            name: 'profiles',
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                type: 'mariadb',
                host: configService.get<string>('MARIADB_HOST'),
                port: configService.get<number>('MARIADB_PORT'),
                username: configService.get<string>('MARIADB_USERNAME'),
                password: configService.get<string>('MARIADB_PASSWORD'),
                database: configService.get<string>('MARIADB_NAME_PROFILE'),
                entities: [
                    ProfileEntity,
                    ProfileStripeAccountEntity
                ],
                synchronize: false,
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forRootAsync({
            name: 'products',
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                type: 'mariadb',
                host: configService.get<string>('MARIADB_HOST'),
                port: configService.get<number>('MARIADB_PORT'),
                username: configService.get<string>('MARIADB_USERNAME'),
                password: configService.get<string>('MARIADB_PASSWORD'),
                database: configService.get<string>('MARIADB_NAME_PRODUCT'),
                entities: [
                    ProfileProductEntity,
                    ProductEntity,
                    ProfileProductPriceEntity
                ],
                synchronize: false,
            }),
            inject: [ConfigService],
        }),
        TypeOrmModule.forFeature([
            TransactionEntity,
            TransactionDecisionEntity,
            TransactionPaymentEntity,
            TransactionPaymentDocumentEntity,
            TransactionPaymentMethodEntity,
            TransactionPaymentStateEntity,
            TransactionStateEntity,
            TransactionDetailView,
            ShoppingCartDetailViewEntity,
            ShoppingCartEntity
        ]),
        TypeOrmModule.forFeature([
            ProfileEntity,
            ProfileStripeAccountEntity
        ], 'profiles'),
        TypeOrmModule.forFeature([
            ProductEntity,
            ProfileProductEntity
        ], 'products'),
    ],
    exports: [TypeOrmModule],
})
export class MariaDBDataSourceModule { }