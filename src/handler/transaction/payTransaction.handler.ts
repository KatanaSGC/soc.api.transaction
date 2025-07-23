import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { PayTransactionCommand } from "src/command/transaction/payTransaction.command";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { ProfileEntity } from "src/entities/profile.entity";
import { ProfileProductEntity } from "src/entities/profileProduct.entity";
import { ShoppingCartEntity } from "src/entities/shoppingCart.entity";
import { ShoppingCartDetailViewEntity } from "src/entities/shoppingCartDetailView.entity";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionPaymentEntity } from "src/entities/transactionPayment.entity";
import { TransactionPaymentStateEntity } from "src/entities/transactionPaymentState.entity";
import { TransactionStateEntity } from "src/entities/transactionState.entity";
import { StripeService } from "src/services/stripe.service";
import { Repository } from "typeorm";

let transaction: TransactionEntity | null = null;
let transactionPayment: TransactionPaymentEntity | null = null;
let nextTransactionPaymentState: TransactionPaymentStateEntity | null = null;
let firstTransactionPaymentState: TransactionPaymentStateEntity | null = null;
let nextTransactionState: TransactionStateEntity | null = null;
let checkPaymentStatus: {
    status: 'pending' | 'completed' | 'failed';
    chargeId?: string;
    paymentIntentId?: string;
    sessionId?: string;
} | null = null;

@CommandHandler(PayTransactionCommand)
export class PayTransactionHandler implements ICommandHandler<PayTransactionCommand> {
    constructor(
        private readonly stripeService: StripeService,
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(TransactionStateEntity)
        private readonly transactionStateRepository: Repository<TransactionStateEntity>,
        @InjectRepository(TransactionPaymentEntity)
        private readonly transactionPaymentRepository: Repository<TransactionPaymentEntity>,
        @InjectRepository(TransactionPaymentStateEntity)
        private readonly transactionPaymentStateRepository: Repository<TransactionPaymentStateEntity>,
        @InjectRepository(ShoppingCartEntity)
        private readonly shoppingCartRepository: Repository<ShoppingCartEntity>,
        @InjectRepository(ShoppingCartDetailViewEntity)
        private readonly shoppingCartDetailViewRepository: Repository<ShoppingCartDetailViewEntity>,
        @InjectRepository(ProfileEntity, 'profiles')
        private readonly profileRepository: Repository<ProfileEntity>,
        @InjectRepository(ProfileProductEntity, 'products')
        private readonly profileProductRepository: Repository<ProfileProductEntity>,
    ) { }

    async execute(command: PayTransactionCommand): Promise<ApiResponse<boolean>> {
        const response = new ApiResponse<boolean>();

        const [isValid, message] = await this.validatePaymentAndLoadData(command.TransactionCode);
        if (!isValid) {
            response.data = false;
            response.message = message;
            response.status = ResponseCode.ERROR;
            return response;
        }

        await this.removeProductsFromInventoryAndCreateTransaction(command.TransactionCode);

        transactionPayment!.TransactionPaymentStateId = nextTransactionPaymentState!.Id;
        transactionPayment!.StripePaymentIntentId = checkPaymentStatus!.paymentIntentId || '';

        await this.transactionPaymentRepository.save(transactionPayment!);

        response.data = true;
        response.message = "Transaccion pagada.";
        response.status = ResponseCode.SUCCESS;
        return response;
    }

    private async validatePaymentAndLoadData(transactionCode: string): Promise<[boolean, string]> {
        transaction = await this.transactionRepository.findOneBy({
            TransactionCode: transactionCode
        });
        if (!transaction)
            return [true, 'No se encontro la transaccion, verifique el codigo de transaccion.']

        transactionPayment = await this.transactionPaymentRepository.findOneBy({
            TransactionCode: transactionCode
        });
        if (!transactionPayment)
            return [true, 'No se ha generado un pago para esta transaccion.']

        checkPaymentStatus = await this.stripeService.checkPaymentStatus(transactionPayment.StripePaymentLinkId);
        if (!checkPaymentStatus)
            return [true, 'El pago no se ha completado o no existe.']

        if (checkPaymentStatus.status !== 'completed')
            return [true, 'El pago no se ha completado correctamente.']

        const findTransactionPaymentState = await this.transactionPaymentStateRepository.findOneBy({
            Id: transactionPayment.TransactionPaymentStateId,
        });
        if (findTransactionPaymentState!.TransactionPaymentStateCode !== 'TPS-01')
            return [true, 'La transaccion ya ha sido pagada.']

        nextTransactionState = await this.transactionStateRepository.findOneBy({
            TransactionStateCode: 'TS-02'
        });

        firstTransactionPaymentState = await this.transactionPaymentStateRepository.findOneBy({
            TransactionPaymentStateCode: 'TPS-01'
        });

        nextTransactionPaymentState = await this.transactionPaymentStateRepository.findOneBy({
            TransactionPaymentStateCode: 'TPS-02'
        });

        return [true, 'Ok']
    }

    private async removeProductsFromInventoryAndCreateTransaction(transactionCode: string) {
        const findFlowTransaction = await this.transactionRepository.findBy({
            TransactionCode: transactionCode,
            TransactionStateId: firstTransactionPaymentState?.Id
        });

        console.log('findFlowTransaction', findFlowTransaction);

        const selectUsernames = [...new Set(findFlowTransaction.map(t => t.Username))];

        console.log('selectUsernames', selectUsernames);

        const shoppingCart = findFlowTransaction[0].ShoppingCartCode;

        console.log('shoppingCart', shoppingCart);

        const findShoppingCart = await this.shoppingCartRepository.findOneBy({
            ShoppingCartCode: shoppingCart
        });

        console.log('findShoppingCart', findShoppingCart);

        var shoppingCartDetails: ShoppingCartDetailViewEntity[] = [];
        shoppingCartDetails = await this.shoppingCartDetailViewRepository.findBy({
            ShoppingCartId: findShoppingCart!.Id
        });

        console.log('shoppingCartDetails', shoppingCartDetails);

        for (const username of selectUsernames) {
            const transactionSeller = findFlowTransaction.find(t => t.Username === username)

            console.log('transactionSeller', transactionSeller);

            transactionSeller!.Id = 0;
            transactionSeller!.TransactionStateId = nextTransactionState!.Id;
            transactionSeller!.CreatedAt = undefined as any;

            await this.transactionRepository.save(transactionSeller!);

            if (transactionSeller!.IsBuyTransaction === true) {
                continue
            }

            const findProfile = await this.profileRepository.findOneBy({
                Identify: username
            });

            console.log('findProfile', findProfile);

            const shoppingCartDetailsByUser = shoppingCartDetails.filter(scd => scd.ProfileId === findProfile?.Id);

            console.log('shoppingCartDetailsByUser', shoppingCartDetailsByUser);

            for (const shoppingCartDetail of shoppingCartDetailsByUser) {
                const removeProduct = new ProfileProductEntity();
                removeProduct.ProfileId = findProfile?.Id || 0;
                removeProduct.ProductId = shoppingCartDetail.ProductId;
                removeProduct.UnitTypeId = shoppingCartDetail.UnitTypeId;
                removeProduct.Units = -Math.abs(shoppingCartDetail.Units);

                await this.profileProductRepository.save(removeProduct);
            }

        }
    }
}