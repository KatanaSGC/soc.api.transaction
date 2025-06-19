import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { TransactionDetailView } from "src/entities/transactionDetailView.entity";
import { FindAllTransactionQuery } from "src/query/transaction/findAllTransaction.query";
import { Repository } from "typeorm";

@QueryHandler(FindAllTransactionQuery)
export class FindAllTransactionHandler implements IQueryHandler<FindAllTransactionQuery> {

    constructor(
        @InjectRepository(TransactionDetailView)
        private readonly transactionRepository: Repository<TransactionDetailView>,
    ) { }

    async execute(query: FindAllTransactionQuery): Promise<ApiResponse<TransactionDetailView[]>> {
        try {
            const apiResponse = new ApiResponse<TransactionDetailView[]>();

            const transactions = await this.transactionRepository.query(
                'SELECT * FROM TransactionDetailView WHERE BuyerUsername = ? OR SellerUsername = ?',
                [query.Username, query.Username]);

            apiResponse.data = transactions;
            apiResponse.message = "Transactions retrieved successfully.";
            apiResponse.status = ResponseCode.SUCCESS
            return apiResponse;
        } catch (error) {
            throw new Error(`Error retrieving transactions: ${error.message}`)
        }
    }

}