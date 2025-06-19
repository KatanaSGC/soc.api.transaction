import { Command, CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { GeneratePaymentCommand } from "src/command/transactionPayment/generatePayment.command";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { TransactionEntity } from "src/entities/transaction.entity";
import Stripe from "stripe";
import { Repository } from "typeorm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-05-28.basil",
});

@CommandHandler(GeneratePaymentCommand)
export class GeneratePaymentHandler implements ICommandHandler<GeneratePaymentCommand> {
    constructor(
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
    ) { }

    async execute(command: GeneratePaymentCommand): Promise<ApiResponse<boolean>> {
        const findTransaction = await this.transactionRepository.findOneBy({
            TransactionCode: command.TransactionCode
        })
        if (!findTransaction) {
            throw new Error("Transaction not found.");
        }

        const amount = findTransaction.AmountOffered;
        const currency = "hnl";
        const description = `Pago de transacción ${findTransaction.TransactionCode}`;

        const product = await stripe.products.create({
            name: description,
        });

        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: amount,
            currency: currency,
        });

        throw new Error("Method not implemented.");
    }

}