import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateTransactionCommand } from 'src/command/transaction/createTransaction.command';
import { GenerateTransactionCommand } from 'src/command/transaction/generateTransaction.command';
import { UpdateTransactionCommand } from 'src/command/transaction/updateTransaction.command';
import { ApiResponse } from 'src/common/response/apiResponse.dto';
import { PaymentLinkDto } from 'src/common/transaction/paymentLink.dto';
import { TransactionDetailView } from 'src/entities/transactionDetailView.entity';
import { FindAllTransactionQuery } from 'src/query/transaction/findAllTransaction.query';

@Controller('transactions/transaction')
export class TransactionController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus
  ) {}

  @Post('/create-transaction')
  async createTransaction(@Body() command: CreateTransactionCommand) : Promise<ApiResponse<string>> {
    return await this.commandBus.execute(command);
  }

  @Put('/update-transaction')
  async updateTransaction(@Body() command: UpdateTransactionCommand) : Promise<ApiResponse<boolean>> {
    return await this.commandBus.execute(command);
  }

  @Get('/find-all-transaction')
  async findAllTransaction(@Query('username') username: string) : Promise<ApiResponse<TransactionDetailView[]>> {
    return await this.queryBus.execute(new FindAllTransactionQuery(username));
  }

  @Post('/generate-transaction')
  async generateTransaction(@Body() command: GenerateTransactionCommand): Promise<ApiResponse<PaymentLinkDto>> {
    return await this.commandBus.execute(command);
  }
}
