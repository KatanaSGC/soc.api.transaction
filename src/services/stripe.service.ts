import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
    private stripe: Stripe;

    constructor(private configService: ConfigService) {
        this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY') || '', {
            apiVersion: '2025-05-28.basil',
        });
    }

    async createPaymentLink(
        amount: number,
        currency: string = 'usd',
        description: string,
        transactionCode: string,
    ): Promise<{ url: string; id: string }> {
        try {
            const product = await this.stripe.products.create({
                name: description,
                metadata: {
                    transactionCode: transactionCode,
                },
            });

            const price = await this.stripe.prices.create({
                product: product.id,
                unit_amount: Math.round(amount * 100),
                currency: currency.toLowerCase(),
            });

            const paymentLink = await this.stripe.paymentLinks.create({
                line_items: [
                    {
                        price: price.id,
                        quantity: 1,
                    },
                ],
                metadata: {
                    transactionCode: transactionCode,
                },
                after_completion: {
                    type: 'redirect',
                    redirect: {
                        url: `${this.configService.get<string>('APP_URL')}/transaction/payment/success?transaction=${transactionCode}`,
                    },
                },
            });

            return {
                url: paymentLink.url,
                id: paymentLink.id,
            };
        } catch (error) {
            throw new Error(`Error creating payment link: ${error.message}`);
        }
    }

    async checkPaymentStatus(paymentLinkId: string): Promise<{
        status: 'pending' | 'completed' | 'failed';
        chargeId?: string;
        paymentIntentId?: string;
        sessionId?: string;
    }> {
        try {
            const sessions = await this.stripe.checkout.sessions.list({
                payment_link: paymentLinkId,
                limit: 100
            });

            const completedSession = sessions.data.find(session =>
                session.payment_status === 'paid'
            );

            if (completedSession && completedSession.payment_intent) {
                const paymentInfo = await this.getPaymentDetails(
                    completedSession.payment_intent as string
                );

                return {
                    status: 'completed',
                    chargeId: paymentInfo.chargeId,
                    paymentIntentId: paymentInfo.paymentIntentId,
                    sessionId: completedSession.id
                };
            }

            const failedSession = sessions.data.find(session =>
                session.payment_status === 'unpaid'
            );

            if (failedSession) {
                return {
                    status: 'failed',
                    sessionId: failedSession.id
                };
            }

            return { status: 'pending' };
        } catch (error) {
            throw new Error(`Error checking payment status: ${error.message}`);
        }
    }


    private async getPaymentDetails(paymentIntentId: string): Promise<{
        chargeId?: string;
        paymentIntentId: string;
    }> {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

            let chargeId: string | undefined;

            if (paymentIntent.status === 'succeeded') {
                try {
                    const charges = await this.stripe.charges.list({
                        payment_intent: paymentIntentId,
                        limit: 1
                    });

                    if (charges.data && charges.data.length > 0) {
                        chargeId = charges.data[0].id;
                    }
                } catch (chargeError) {
                    console.warn(`Could not retrieve charges for payment intent ${paymentIntentId}:`, chargeError.message);
                }
            }

            return {
                chargeId,
                paymentIntentId: paymentIntent.id
            };
        } catch (error) {
            console.error(`Error retrieving payment details for ${paymentIntentId}:`, error.message);
            return {
                paymentIntentId
            };
        }
    }

    async createCheckoutSession(
        amount: number,
        currency: string = 'usd',
        description: string,
        transactionCode: string,
        successUrl?: string,
        cancelUrl?: string
    ): Promise<{ url: string; id: string }> {
        try {
            const session = await this.stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [
                    {
                        price_data: {
                            currency: currency.toLowerCase(),
                            product_data: {
                                name: description,
                                metadata: {
                                    transactionCode: transactionCode,
                                },
                            },
                            unit_amount: Math.round(amount * 100), // Stripe maneja centavos
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: successUrl || `${this.configService.get<string>('APP_URL')}/payment/success/${transactionCode}`,
                cancel_url: cancelUrl || `${this.configService.get<string>('APP_URL')}/payment/cancel?transaction=${transactionCode}`,
                metadata: {
                    transactionCode: transactionCode,
                },
            });

            return {
                url: session.url || '',
                id: session.id,
            };
        } catch (error) {
            throw new Error(`Error creating checkout session: ${error.message}`);
        }
    }

    async retrievePaymentLink(paymentLinkId: string): Promise<Stripe.PaymentLink> {
        return await this.stripe.paymentLinks.retrieve(paymentLinkId);
    }

    async retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
        return await this.stripe.checkout.sessions.retrieve(sessionId);
    }

    async constructWebhookEvent(body: string, signature: string): Promise<Stripe.Event> {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new Error('Stripe webhook secret not configured');
        }

        return this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }

    async createTransfer(
        amount: number,
        currency: string = 'hnl',
        destination: string,
        description?: string,
        transferGroup?: string
    ): Promise<Stripe.Transfer> {
        try {
            const transfer = await this.stripe.transfers.create({
                amount: Math.round(amount * 100),
                currency: currency.toLowerCase(),
                destination: destination,
                description: description,
                transfer_group: transferGroup,
            });

            return transfer;
        } catch (error) {
            throw new Error(`Error creating transfer: ${error.message}`);
        }
    }

    async retrieveTransfer(transferId: string): Promise<Stripe.Transfer> {
        try {
            return await this.stripe.transfers.retrieve(transferId);
        } catch (error) {
            throw new Error(`Error retrieving transfer: ${error.message}`);
        }
    }

    async createConnectedAccount(
        email: string,
        country: string = 'US',
        type: 'express' | 'standard' = 'express'
    ): Promise<Stripe.Account> {
        try {
            const account = await this.stripe.accounts.create({
                type: type,
                country: country,
                email: email,
                capabilities: {
                    transfers: { requested: true },
                },
            });

            return account;
        } catch (error) {
            throw new Error(`Error creating connected account: ${error.message}`);
        }
    }

    async createAccountLink(
        accountId: string,
        refreshUrl: string,
        returnUrl: string,
        type: 'account_onboarding' | 'account_update' = 'account_onboarding'
    ): Promise<Stripe.AccountLink> {
        try {
            const accountLink = await this.stripe.accountLinks.create({
                account: accountId,
                refresh_url: refreshUrl,
                return_url: returnUrl,
                type: type,
            });

            return accountLink;
        } catch (error) {
            throw new Error(`Error creating account link: ${error.message}`);
        }
    }

    async createCustomer(
        email: string,
        name?: string,
        metadata?: Stripe.MetadataParam
    ): Promise<Stripe.Customer> {
        try {
            const customer = await this.stripe.customers.create({
                email: email,
                name: name,
                metadata: metadata,
            });

            return customer;
        } catch (error) {
            throw new Error(`Error creating customer: ${error.message}`);
        }
    }

    async createRefund(
        paymentIntentId: string,
        amount?: number,
        reason?: string,
        metadata?: Stripe.MetadataParam
    ): Promise<Stripe.Refund> {
        try {
            const refundParams: Stripe.RefundCreateParams = {
                payment_intent: paymentIntentId,
                reason: reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
                metadata: metadata || {}
            };

            if (amount) {
                refundParams.amount = Math.round(amount * 100);
            }

            const refund = await this.stripe.refunds.create(refundParams);
            return refund;
        } catch (error) {
            throw new Error(`Error creating refund: ${error.message}`);
        }
    }

    async retrieveRefund(refundId: string): Promise<Stripe.Refund> {
        try {
            return await this.stripe.refunds.retrieve(refundId);
        } catch (error) {
            throw new Error(`Error retrieving refund: ${error.message}`);
        }
    }

    async listRefunds(paymentIntentId?: string, limit: number = 10): Promise<Stripe.ApiList<Stripe.Refund>> {
        try {
            const params: Stripe.RefundListParams = { limit };
            if (paymentIntentId) {
                params.payment_intent = paymentIntentId;
            }
            return await this.stripe.refunds.list(params);
        } catch (error) {
            throw new Error(`Error listing refunds: ${error.message}`);
        }
    }
}
