import { Inject } from "@nestjs/common";
import { Command, CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { CompleteTransactionCommand } from "src/command/transaction/completeTransaction.comand";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { ProfileEntity } from "src/entities/profile.entity";
import { ProfileProductEntity } from "src/entities/profileProduct.entity";
import { TransactionEntity } from "src/entities/transaction.entity";
import { TransactionPaymentEntity } from "src/entities/transactionPayment.entity";
import { TransactionPaymentStateEntity } from "src/entities/transactionPaymentState.entity";
import { TransactionStateEntity } from "src/entities/transactionState.entity";
import { MailService } from "src/services/mailer/mail.service";
import { In, Repository } from "typeorm";

@CommandHandler(CompleteTransactionCommand)
export class CompleteTransactionHandler implements ICommandHandler<CompleteTransactionCommand> {
    constructor(
        @InjectRepository(TransactionEntity)
        private readonly transactionRepository: Repository<TransactionEntity>,
        @InjectRepository(TransactionPaymentEntity)
        private readonly transactionPaymentRepository: Repository<TransactionPaymentEntity>,
        @InjectRepository(TransactionStateEntity)
        private readonly transactionStateRepository: Repository<TransactionStateEntity>,
        @InjectRepository(TransactionPaymentStateEntity)
        private readonly transactionPaymentStateRepository: Repository<TransactionPaymentStateEntity>,
        @InjectRepository(ProfileEntity, 'profiles')
        private readonly profileRepository: Repository<ProfileEntity>,
        @InjectRepository(ProfileProductEntity, 'products')
        private readonly profileProductRepository: Repository<ProfileProductEntity>,
        @Inject(MailService) private readonly mailService: MailService,
    ) { }

    async execute(command: CompleteTransactionCommand): Promise<ApiResponse<boolean>> {
        const response = new ApiResponse<boolean>();

        const findTransactionState = await this.transactionStateRepository.findOneBy({
            TransactionStateCode: 'TS-02'
        });

        const findTransactions = await this.transactionRepository.find({
            where: {
                TransactionCode: command.TransactionCode,
                TransactionStateId: findTransactionState?.Id
            }
        });

        if (findTransactions.length === 0) {
            response.status = ResponseCode.ERROR;
            response.message = "La transacción no se encuentra en estado pendiente.";
            response.data = null;
            return response;
        }

        const findTransactionPayment = await this.transactionPaymentRepository.findOne({
            where: {
                TransactionCode: command.TransactionCode
            },
            order: {
                CreatedAt: "DESC"
            }
        });
        if (!findTransactionPayment) {
            response.status = ResponseCode.ERROR;
            response.message = "No se encontro información de pago para la transacción.";
            response.data = null;
        }

        if (findTransactionPayment!.TransactionUnlockCode !== command.TransactionUnlockCode) {
            response.status = ResponseCode.ERROR;
            response.message = "El código de desbloqueo de la transacción no es correcto.";
            response.data = null;
            return response;
        }

        const nextTransactionState = await this.transactionStateRepository.findOne({
            where: {
                TransactionStateCode: 'TS-03'
            }
        });

        const findTransactionSeller = findTransactions.find(t => t.IsBuyTransaction === false);

        const sellTransaction = findTransactionSeller;

        sellTransaction!.Id = 0;
        sellTransaction!.CreatedAt = new Date();
        sellTransaction!.TransactionStateId = nextTransactionState!.Id;

        await this.transactionRepository.save(sellTransaction!);

        const buyTransaction = findTransactions.find(t => t.IsBuyTransaction === true);

        buyTransaction!.Id = 0;;
        buyTransaction!.CreatedAt = new Date();
        buyTransaction!.TransactionStateId = nextTransactionState!.Id;

        await this.transactionRepository.save(buyTransaction!);

        const findProfile = await this.profileRepository.findOne({
            where: {
                Identify: buyTransaction!.Username
            }
        });

        this.mailService.sendEmail(
            findProfile!.Email,
            "Transacción Completada " + findProfile?.Identify,
            `La transacción ${buyTransaction!.TransactionCode} ha sido completada exitosamente.`,
            `<p>La transacción <strong>${buyTransaction!.TransactionCode}</strong> ha sido completada exitosamente.</p> <p>Se ha iniciado el proceso de pago.</p> <p>Gracias por utilizar nuestros servicios.</p> `,
        );

        this.mailService.sendEmail(
            process.env.EMAIL_ADMIN!,
            "Transacción Completada"+ findProfile?.Identify,
            `La transacción ${buyTransaction!.TransactionCode} ha sido completada exitosamente.`,
            `<p>La transacción <strong>${buyTransaction!.TransactionCode}</strong> ha sido completada exitosamente.</p> <p>Se ha iniciado el proceso de pago.</p> <p>Gracias por utilizar nuestros servicios.</p> `,
        );

        response.status = ResponseCode.SUCCESS;
        response.message = "Transacción completada correctamente.";
        response.data = true;

        return response;
    }
}