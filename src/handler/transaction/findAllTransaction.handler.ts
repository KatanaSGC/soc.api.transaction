import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { TransactionDetailDto } from "src/common/transaction/transactionDetail.dto";
import { ProfileEntity } from "src/entities/profile.entity";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionDetailView } from "src/entities/transactionDetailView.entity";
import { TransactionPaymentEntity } from "src/entities/transactionPayment.entity";
import { TransactionStateEntity } from "src/entities/transactionState.entity";
import { FindAllTransactionQuery } from "src/query/transaction/findAllTransaction.query";
import { In, Repository } from "typeorm";

const transactionStateCodes = ['TS-01', 'TS-02'];

@QueryHandler(FindAllTransactionQuery)
export class FindAllTransactionHandler implements IQueryHandler<FindAllTransactionQuery> {

    constructor(
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(ProfileEntity, 'profiles')
        private readonly profileRepository: Repository<ProfileEntity>,
        @InjectRepository(TransactionStateEntity)
        private readonly transactionStateRepository: Repository<TransactionStateEntity>,
        @InjectRepository(TransactionPaymentEntity)
        private readonly transactionPaymentRepository: Repository<TransactionPaymentEntity>
    ) { }

    async execute(query: FindAllTransactionQuery): Promise<ApiResponse<TransactionDetailDto[]>> {
        try {
            const apiResponse = new ApiResponse<TransactionDetailDto[]>();
            apiResponse.data = [];

            const findUsername = await this.profileRepository.findOne({
                where: {
                    Identify: query.Username
                }
            });

            if (!findUsername) {
                apiResponse.message = "User not found.";
                apiResponse.status = ResponseCode.SUCCESS;
                return apiResponse;
            }

            const transactionStates = await this.transactionStateRepository.find({
                where: {
                    TransactionStateCode: In(transactionStateCodes)
                }
            });

            const findTransactions = await this.transactionRepository.find({
                where: {
                    Username: findUsername.Identify,
                    TransactionStateId: In(transactionStates.map(state => state.Id))
                },
            });
            if (!findTransactions || findTransactions.length === 0) {
                apiResponse.message = "No transactions found.";
                apiResponse.status = ResponseCode.SUCCESS;
                return apiResponse;
            }

            const transactionsCodes = findTransactions.map(transaction => transaction.TransactionCode);
            const findAllTransactions = await this.transactionRepository.find({
                where: {
                    TransactionCode: In(transactionsCodes)
                },
            });

            const profiles = findAllTransactions.map(transaction => transaction.Username);
            const findProfiles = await this.profileRepository.find({
                where: {
                    Identify: In(profiles)
                }
            });

            const findAllTransactionPayments = await this.transactionPaymentRepository.find({
                where: {
                    TransactionCode: In(transactionsCodes)
                }
            });

            const transactionDetailViews: TransactionDetailDto[] = [];

            findTransactions.forEach(transaction => {
                const findSellTransaction = findAllTransactions
                    .find(t => t.TransactionCode === transaction.TransactionCode 
                        && t.IsBuyTransaction === false);
                const findBuyTransaction = findAllTransactions
                    .find(t => t.TransactionCode === transaction.TransactionCode 
                        && t.IsBuyTransaction === true);


                const findBuyerProfile = findProfiles.find(p => p.Identify === findBuyTransaction!.Username);  
                const findSellerProfile = findProfiles.find(p => p.Identify === findSellTransaction!.Username);
                
                const transactionDetail = new TransactionDetailDto();                
                transactionDetail.SellerUsername = findSellTransaction ? findSellTransaction.Username : '';
                transactionDetail.TransactionCode = transaction.TransactionCode;
                transactionDetail.Amount = Number(transaction.Amount);;
                transactionDetail.TransactionState = transactionStates.find(state => state.Id === transaction.TransactionStateId)?.Description || '';
                transactionDetail.TransactionStateCode = transactionStates
                    .find(state => state.Id === transaction.TransactionStateId)?.TransactionStateCode || '';
                
                const payment = findAllTransactionPayments
                    .find(payment => payment.TransactionCode === transaction.TransactionCode)
                
                if(transactionDetail.TransactionStateCode === 'TS-01') {
                    transactionDetail.PaymentLink = payment?.PaymentUrl || '';
                }
                else {
                    transactionDetail.PaymentLink = '';
                }


                transactionDetail.BuyerUsername = findBuyerProfile!.Identify;     
                transactionDetail.BuyerNames = findBuyerProfile!.Names;
                transactionDetail.BuyerSurnames = findBuyerProfile!.Surnames;
                transactionDetail.BuyerEmail = findBuyerProfile!.Email;
                transactionDetail.BuyerPhone = findBuyerProfile!.Phone!;

                transactionDetail.SellerNames = findSellerProfile!.Names;
                transactionDetail.SellerSurnames = findSellerProfile!.Surnames;
                transactionDetail.SellerEmail = findSellerProfile!.Email;
                transactionDetail.SellerPhone = findSellerProfile!.Phone!;
                transactionDetail.CreatedAt = transaction.CreatedAt;    
                transactionDetail.ShoppingCartCode = transaction.ShoppingCartCode;
                transactionDetail.TransactionUnlockCode = payment?.TransactionUnlockCode || '';
                
                transactionDetailViews.push(transactionDetail);
            })

            apiResponse.data = transactionDetailViews;
            apiResponse.message = "Se cargaron las transacciones correctamente.";
            apiResponse.status = ResponseCode.SUCCESS
            return apiResponse;
        } catch (error) {
            throw new Error(`Error retrieving transactions: ${error.message}`)
        }
    }

}