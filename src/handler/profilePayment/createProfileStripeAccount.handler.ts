import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateProfileStripeAccountCommand } from "src/command/profilePayment/createProfileStripeAccount.command";
import { ApiResponse } from "src/common/response/apiResponse.dto";
import { ResponseCode } from "src/common/response/responseCode";
import { ProfileEntity } from "src/entities/profile.entity";
import { ProfileStripeAccountEntity } from "src/entities/profileStripeAccount.entity";
import { StripeService } from "src/services/stripe.service";
import Stripe from "stripe";
import { Repository } from "typeorm";

@CommandHandler(CreateProfileStripeAccountCommand)
export class CreateProfileStripeAccountHandler implements ICommandHandler<CreateProfileStripeAccountCommand> {

    constructor(
        private readonly stripeService: StripeService,
        @InjectRepository(ProfileEntity, 'profiles')
        private readonly profileRepository: Repository<ProfileEntity>,
        @InjectRepository(ProfileStripeAccountEntity, 'profiles')
        private readonly profileStripeAccountRepository: Repository<ProfileStripeAccountEntity>
    ) { }

    async execute(command: CreateProfileStripeAccountCommand): Promise<ApiResponse<boolean>> {
        const apiResponse = new ApiResponse<boolean>();

        const findProfile = await this.profileRepository.findOneBy({ Identify: command.Identify });
        if (!findProfile) {
            apiResponse.status = ResponseCode.ERROR;
            apiResponse.message = "No se encontro el perfil.";
            return apiResponse;
        }

        const findStripeAccount = await this.profileStripeAccountRepository.findOneBy({ ProfileId: findProfile.Id });
        if (findStripeAccount) {
            apiResponse.status = ResponseCode.ERROR;
            apiResponse.message = "Ya existe una cuenta de Stripe asociada a este perfil.";
            return apiResponse;
        }

        const metadata: Stripe.MetadataParam = {
            internal_user_id: command.Identify,
            plan_type: 'premium',
            signup_source: 'web-portal'
        };

        const stripeAccount = await this.stripeService.createCustomer(command.StripeEmail, command.StripeName, metadata);
        if (!stripeAccount) {
            apiResponse.status = ResponseCode.ERROR;
            apiResponse.message = "Error al crear la cuenta de Stripe.";
            return apiResponse;
        }   

        const profileStripeAccount = new ProfileStripeAccountEntity();
        profileStripeAccount.ProfileId = findProfile.Id;
        profileStripeAccount.StripeEmail = command.StripeEmail;
        profileStripeAccount.StripeName = command.StripeName;
        profileStripeAccount.StripeAccountId = stripeAccount.id;


        await this.profileStripeAccountRepository.save(profileStripeAccount);
        
        apiResponse.status = ResponseCode.SUCCESS;
        apiResponse.message = "Cuenta de Stripe creada exitosamente.";
        apiResponse.data = true;
        return apiResponse;
    }

}