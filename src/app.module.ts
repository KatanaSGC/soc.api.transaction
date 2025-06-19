import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MariaDBDataSourceModule } from './data-source/mariadb.datasource.module';
import { TransactionModule } from './handler/transaction/transaction.module';
import { AliveSignalController } from './controller/aliveSignal.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { TransactionController } from './controller/transaction.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MariaDBDataSourceModule,
    TransactionModule,
    CqrsModule
  ],
  controllers: [
    AppController,
    AliveSignalController,
    TransactionController
  ],
  providers: [AppService],
})
export class AppModule { }
