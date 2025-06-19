import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateTransactionCommand } from "src/command/transaction/createTransaction.command";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { ProductEntity } from "src/entities/product.entity";
import { ProfileEntity } from "src/entities/profile.entity";
import { ProfileProductEntity } from "src/entities/profileProduct.entity";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionDecisionEntity } from "src/entities/transactionDecision.entity";
import { TransactionStateEntity } from "src/entities/transactionState.entity";
import { Repository } from "typeorm";

let product: ProductEntity | null = null;

@CommandHandler(CreateTransactionCommand)
export class CreateTransactionHandler implements ICommandHandler<CreateTransactionCommand> {
    constructor(
        @InjectRepository(ProfileEntity, 'profiles')
        private readonly profileRepository: Repository<ProfileEntity>,
        @InjectRepository(ProductEntity, 'products')
        private readonly productRepository: Repository<ProductEntity>,
        @InjectRepository(ProfileProductEntity, 'products')
        private readonly profileProductRepository: Repository<ProfileProductEntity>,
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(TransactionStateEntity)
        private readonly transactionStateRepository: Repository<TransactionStateEntity>,
        @InjectRepository(TransactionDecisionEntity)
        private readonly transactionDecisionRepository: Repository<TransactionDecisionEntity>
    ) {

    }

    async execute(command: CreateTransactionCommand): Promise<ApiResponse<boolean>> {
        try {
            const response = new ApiResponse<boolean>();

            const [isValidUsernames, usernameMessage] = await this.validateUsernames(command.SellerUsername, command.BuyerUsername);
            if (!isValidUsernames) {
                response.status = ResponseCode.ERROR;
                response.data = false;
                response.message = usernameMessage;
                return response;
            }

            const [isValidProduct, productMessage] = await this.validateProduct(command);
            if (!isValidProduct) {
                response.status = ResponseCode.ERROR;
                response.data = false;
                response.message = productMessage;
                return response;
            }

            const findTransactionState = await this.transactionStateRepository.findOneBy({ TransactionStateCode: 'TS-01' });

            const findDuplicateTransaction = await this.transactionRepository.findBy({
                SellerUsername: command.SellerUsername,
                BuyerUsername: command.BuyerUsername,
                ProductId: product?.Id || 0,
                TransactionStateId: findTransactionState?.Id || 0
            })

            if (findDuplicateTransaction.length > 0) {
                response.status = ResponseCode.ERROR;
                response.data = false;
                response.message = 'Ya existe una transacción pendiente entre el vendedor y el comprador para este producto';
                return response;
            }

            const createTransaction = new TransactionEntity();
            createTransaction.SellerUsername = command.SellerUsername;
            createTransaction.BuyerUsername = command.BuyerUsername;
            createTransaction.TransactionCode = await this.generateTransactionCode();
            createTransaction.ProductDescription = product?.Description || '';
            createTransaction.ProductUnits = command.ProductUnits;
            createTransaction.AmountOffered = command.AmountOffered;
            createTransaction.TransactionStateId = findTransactionState?.Id || 0;
            createTransaction.ProductId = product?.Id || 0;

            await this.transactionRepository.save(createTransaction);

            const transactionDecision = new TransactionDecisionEntity();
            transactionDecision.TransactionId = createTransaction.Id;
            transactionDecision.Username = command.BuyerUsername;
            transactionDecision.IsAccepted = true;
            transactionDecision.Version = 1;

            await this.transactionDecisionRepository.save(transactionDecision);

            response.status = ResponseCode.SUCCESS;
            response.data = true;
            response.message = 'Transaction created successfully';
            return response;
        } catch (error) {
            throw new Error(`Error creating transaction: ${error.message}`);
        }
    }

    async generateTransactionCode(): Promise<string> {
        const count = await this.countDistinctTransactionCodes();
        const nextNumber = count + 1;
        const padded = nextNumber.toString().padStart(6, '0');
        return `T-${padded}`;
    }

    async countDistinctTransactionCodes(): Promise<number> {
        return this.transactionRepository
            .createQueryBuilder('transaction')
            .select('COUNT(DISTINCT transaction.TransactionCode)', 'count')
            .getRawOne()
            .then(result => Number(result.count));
    }

    async validateProduct(command: CreateTransactionCommand): Promise<[boolean, string]> {
        const profileProduct = await this.profileProductRepository.findOneBy({ Id: command.ProfileProductId });
        if (!profileProduct) return [false, 'Profile product does not exist'];

        if (profileProduct.Units < command.ProductUnits) return [false, 'Insufficient units in profile product'];

        product = await this.productRepository.findOneBy({ Id: profileProduct.ProductId });
        if (!product) return [false, 'Product does not exist'];

        return [true, 'Profile product is valid'];
    }

    async validateUsernames(sellerUsername: string, buyerUsername: string): Promise<[boolean, string]> {
        const sellerProfile = await this.profileRepository.findOneBy({ Identify: sellerUsername });
        if (!sellerProfile) return [false, 'Seller username does not exist'];

        const buyerProfile = await this.profileRepository.findOneBy({ Identify: buyerUsername });
        if (!buyerProfile) return [false, 'Buyer username does not exist'];

        return [true, 'Usernames are valid'];
    }
}