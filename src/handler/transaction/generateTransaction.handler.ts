import { CommandBus, CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { GenerateTransactionCommand } from "src/command/transaction/generateTransaction.command";
import { GeneratePaymentCommand } from "src/command/transactionPayment/generatePayment.command";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { PaymentLinkDto } from "src/common/transaction/paymentLink.dto";
import { ProfileEntity } from "src/entities/profile.entity";
import { ShoppingCartEntity } from "src/entities/shoppingCart.entity";
import { ShoppingCartDetailViewEntity } from "src/entities/shoppingCartDetailView.entity";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionStateEntity } from "src/entities/transactionState.entity";
import { In, Repository } from "typeorm";

let shoppingCartDetails: ShoppingCartDetailViewEntity[] = [];
let transactionState: TransactionStateEntity | null = null;
let totalAmount: number = 0;
let latestCart: ShoppingCartEntity | null = null;

@CommandHandler(GenerateTransactionCommand)
export class GenerateTransactionHandler implements ICommandHandler<GenerateTransactionCommand> {
    constructor(
        @InjectRepository(ShoppingCartEntity)
        private readonly shoppingCartRepository: Repository<ShoppingCartEntity>,
        @InjectRepository(ShoppingCartDetailViewEntity)
        private readonly shoppingCartDetailViewRepository: Repository<ShoppingCartDetailViewEntity>,
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(ProfileEntity, 'profiles')
        private readonly profileRepository: Repository<ProfileEntity>,
        @InjectRepository(TransactionStateEntity)
        private readonly transactionStateRepository: Repository<TransactionStateEntity>,
        private readonly commandBus: CommandBus
    ) {
        shoppingCartDetails = [];
        transactionState = null;
        totalAmount = 0;
        latestCart = null;
     }

    async execute(command: GenerateTransactionCommand): Promise<ApiResponse<PaymentLinkDto>> {
        const response = new ApiResponse<PaymentLinkDto>();
        response.data = new PaymentLinkDto();

        const findUser = await this.profileRepository.findOne({
            where: { Identify: command.BuyerUsername, IsActive: true }
        });
        if (!findUser) {
            response.status = ResponseCode.ERROR;
            response.message = "No se encontro el usuario.";
            return response;
        }

        const [isValid, message] = await this.findShoppingCartDetail(findUser.Id);
        if (!isValid) {
            response.status = ResponseCode.ERROR;
            response.message = message;
            return response;
        }

        const generateTransactionCode = await this.generateTransactionCode();

        transactionState = await this.transactionStateRepository.findOneBy({ TransactionStateCode: 'TS-01' });

        const sellers = [...new Set(shoppingCartDetails.map(shopping => shopping.SellerUsername))];

        sellers.forEach(async seller => {
            await this.createTransactionSeller(seller, generateTransactionCode, command.BuyerUsername);
        });

        const createTransaction = new TransactionEntity();
        createTransaction.TransactionCode = generateTransactionCode;
        createTransaction.Username = command.BuyerUsername;
        createTransaction.Amount = totalAmount;
        createTransaction.TransactionStateId = transactionState!.Id;
        createTransaction.IsBuyTransaction = true;
        createTransaction.ShoppingCartCode = latestCart!.ShoppingCartCode;

        await this.transactionRepository.save(createTransaction);

        const generatePaymentCommand = new GeneratePaymentCommand();
        generatePaymentCommand.TransactionCode = generateTransactionCode;
        generatePaymentCommand.Amount = totalAmount;

        const paymentResponse = await this.commandBus.execute(generatePaymentCommand);
        if (paymentResponse.status !== ResponseCode.SUCCESS) {
            response.status = ResponseCode.ERROR;
            response.message = "Error al generar el enlace de pago.";
            return response;
        }

        const newShoppingCart = new ShoppingCartEntity();
        newShoppingCart.BuyerProfileId = findUser.Id;
        newShoppingCart.ShoppingCartCode = latestCart!.ShoppingCartCode;
        newShoppingCart.Amount = latestCart!.Amount;
        newShoppingCart.IsOpen = false;

        await this.shoppingCartRepository.save(newShoppingCart!);

        response.status = ResponseCode.SUCCESS;
        response.data.PaymentUrl = paymentResponse.data.paymentUrl;
        response.data.PaymentId = paymentResponse.data.paymentId;
        response.message = "Transacción generada exitosamente.";
        return response;
    }

    private async createTransactionSeller(sellerUsername: string, transactionCode: string, buyerUsername: string): Promise<void> {
        const findSellerItems = shoppingCartDetails.filter(item => item.SellerUsername === sellerUsername);
        if (!findSellerItems || findSellerItems.length === 0)
            return;

        const productIds = [...new Set(findSellerItems.map(item => item.ProductId))];
        let sellerAmount = 0;

        productIds.forEach(async item => {

            const filterProducts = findSellerItems.filter(product => product.ProductId === item);
            const product = findSellerItems.find(product => product.ProductId === item);
            const totalUnits = filterProducts.reduce((sum, product) => sum + product.Units, 0);
            const amount = totalUnits * (product?.Amount || 0);            
            sellerAmount += amount;
        });

        const createTransaction = new TransactionEntity();
        createTransaction.TransactionCode = transactionCode;
        createTransaction.Username = sellerUsername;
        createTransaction.Amount = sellerAmount;
        createTransaction.TransactionStateId = transactionState!.Id;
        createTransaction.IsBuyTransaction = false;
        createTransaction.ShoppingCartCode = latestCart!.ShoppingCartCode;

        totalAmount = 0;

        totalAmount += sellerAmount;

        await this.transactionRepository.save(createTransaction);
    }

    private async generateTransactionCode(): Promise<string> {
        const count = await this.countDistinctTransactionCodes();
        const nextNumber = count + 1;
        const padded = nextNumber.toString().padStart(6, '0');
        return `T-${padded}`;
    }

    private async countDistinctTransactionCodes(): Promise<number> {
        return this.transactionRepository
            .createQueryBuilder('transaction')
            .select('COUNT(DISTINCT transaction.TransactionCode)', 'count')
            .getRawOne()
            .then(result => Number(result.count));
    }

    private async findShoppingCartDetail(profileId: number): Promise<[boolean, string]> {
        latestCart = await this.shoppingCartRepository.findOne({
            where: { BuyerProfileId: profileId, IsOpen: true },
            order: { CreatedAt: 'DESC' },
        });
        if (!latestCart)
            return [false, "No se encontro ningún carrito de compras abierto."];

        if (latestCart.IsOpen === false)
            return [false, "El carrito de compras ya está cerrado."];

        shoppingCartDetails = await this.shoppingCartDetailViewRepository.find({
            where: { ShoppingCartId: latestCart.Id },
            order: { ProductName: 'ASC' },
        });
        if (!shoppingCartDetails || shoppingCartDetails.length === 0)
            return [false, "No se encontraron detalles del carrito de compras."];

        return [true, "Ok"];
    }
}