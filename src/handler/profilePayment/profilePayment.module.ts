import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProfileEntity } from "src/entities/profile.entity";
import { CreateProfileStripeAccountHandler } from "./createProfileStripeAccount.handler";
import { ProfileStripeAccountEntity } from "src/entities/profileStripeAccount.entity";
import { StripeService } from "src/services/stripe.service";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [
        CqrsModule,
        ConfigModule,
        TypeOrmModule.forFeature([
            ProfileEntity,
            ProfileStripeAccountEntity
        ], 'profiles')
    ],
    providers: [
        CreateProfileStripeAccountHandler,
        StripeService
    ],
    exports: [
        CreateProfileStripeAccountHandler,
        StripeService
    ]
})
export class ProfileTransactionModule { }