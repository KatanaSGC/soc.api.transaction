import { Body, Controller, Post } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { CreateProfileStripeAccountCommand } from "src/command/profilePayment/createProfileStripeAccount.command";
import { ApiResponse } from "src/common/response/apiResponse.dto";

@Controller('transactions/profile-stripe-account')
export class ProfileStripeAccountController {
    constructor(
        private readonly commandBus: CommandBus) {     
    }

    @Post('/create-profile-stripe-account')
    async createProfileStripeAccount(@Body() command: CreateProfileStripeAccountCommand): Promise<ApiResponse<boolean>> {
        return await this.commandBus.execute(command);
    }
}