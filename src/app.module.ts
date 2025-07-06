import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MariaDBDataSourceModule } from './data-source/mariadb.datasource.module';
import { TransactionModule } from './handler/transaction/transaction.module';
import { TransactionPaymentModule } from './handler/transactionPayment/transactionPayment.module';
import { AliveSignalController } from './controller/aliveSignal.controller';
import { PaymentController } from './controller/payment.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { TransactionController } from './controller/transaction.controller';
import { ProfileStripeAccountController } from './controller/profileStripeAccount.controller';
import { ProfileTransactionModule } from './handler/profilePayment/profilePayment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MariaDBDataSourceModule,
    TransactionModule,
    TransactionPaymentModule,
    CqrsModule,
    ProfileTransactionModule
  ],
  controllers: [
    AppController,
    AliveSignalController,
    TransactionController,
    PaymentController,
    ProfileStripeAccountController
  ],
  providers: [AppService],
})
export class AppModule { }
