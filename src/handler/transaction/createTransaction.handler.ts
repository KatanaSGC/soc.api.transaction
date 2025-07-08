import { CommandBus, CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateTransactionCommand } from "src/command/transaction/createTransaction.command";
import { GeneratePaymentCommand } from "src/command/transactionPayment/generatePayment.command";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { ProductEntity } from "src/entities/product.entity";
import { ProfileEntity } from "src/entities/profile.entity";
import { ProfileProductEntity } from "src/entities/profileProduct.entity";
import { ProfileProductPriceEntity } from "src/entities/profileProductPrice.entity";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionStateEntity } from "src/entities/transactionState.entity";
import { Repository } from "typeorm";

let product: ProductEntity | null = null;
let profileProduct: ProfileProductEntity | null = null;
let profileProductPrice: ProfileProductPriceEntity | null = null;


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
        private readonly commandBus: CommandBus,
        @InjectRepository(ProfileProductPriceEntity, 'products')
        private readonly profileProductPriceRepository: Repository<ProfileProductPriceEntity>
    ) {

    }

    async execute(command: CreateTransactionCommand): Promise<ApiResponse<{ paymentUrl: string; paymentId: string }>> {
        try {
            const response = new ApiResponse<{ paymentUrl: string; paymentId: string }>();

            const [isValidUsernames, usernameMessage] = await this.validateUsernames(command.SellerUsername, command.BuyerUsername);
            if (!isValidUsernames) {
                response.status = ResponseCode.ERROR;
                response.message = usernameMessage;
                return response;
            }

            const [isValidProduct, productMessage] = await this.validateProduct(command);
            if (!isValidProduct) {
                response.status = ResponseCode.ERROR;
                response.message = productMessage;
                return response;
            }

            const findTransactionState = await this.transactionStateRepository.findOneBy({ TransactionStateCode: 'TS-01' });

            profileProductPrice = await this.profileProductPriceRepository.findOne({
                where: {
                    ProfileId: profileProduct!.ProfileId,
                    ProductId: profileProduct!.ProductId,
                    UnitTypeId: profileProduct!.UnitTypeId
                },
                order: {
                    CreatedAt: 'DESC'
                }
            });

            console.log('Createating transaction with profileProductPrice:', profileProductPrice);

            const createTransaction = new TransactionEntity();
            createTransaction.SellerUsername = command.SellerUsername;
            createTransaction.BuyerUsername = command.BuyerUsername;
            createTransaction.TransactionCode = await this.generateTransactionCode();
            createTransaction.ProductDescription = product?.Description || '';
            createTransaction.ProductUnits = command.ProductUnits;
            createTransaction.AmountOffered = profileProductPrice?.Price || 0;
            createTransaction.TransactionStateId = findTransactionState?.Id || 0;
            createTransaction.ProductId = product?.Id || 0;

            await this.transactionRepository.save(createTransaction);

            console.log('Transaction created:', createTransaction);

            const generatePaymentCommand = new GeneratePaymentCommand();
            generatePaymentCommand.TransactionCode = createTransaction.TransactionCode;

            console.log('Generating payment with command:', generatePaymentCommand);

            const generatePayment = await this.commandBus.execute(generatePaymentCommand);
            if (generatePayment.status !== ResponseCode.SUCCESS) {
                response.status = ResponseCode.ERROR;
                response.message = "Transacion creada exitosamente, pero no se pudo generar el enlace de pago, puedes intentar nuevamente en la sección de transacciones.";
                return response;
            }

            console.log('Payment generated:', generatePayment.data);

            response.status = ResponseCode.SUCCESS;
            response.data = generatePayment.data;
            response.message = 'Transacción creada exitosamente.';
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
        profileProduct = await this.profileProductRepository.findOneBy({ Id: command.ProfileProductId });
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