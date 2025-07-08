import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('TransactionPayment')
export class TransactionPaymentEntity {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'int', nullable: false })
    TransactionId: number;    
    
    @Column({ type: 'varchar', length: 32, nullable: false })
    TransactionUnlockCode: string;

    @Column({ type: 'varchar', length: 32, nullable: false })
    TransactionSecurityCode: string;

    @Column({ type: 'int', nullable: false })
    TransactionPaymentStateId: number;

    @Column({ type: 'varchar', nullable: false })
    StripePaymentIntentId: string;

    @Column({ type: 'boolean', default: true })
    IsStripePayment: boolean;

    @Column({ type: 'varchar', length: 255, nullable: true })
    StripePaymentLinkId: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    StripeCheckoutSessionId: string;

    @Column({ type: 'text', nullable: true })
    PaymentUrl: string;W

    @Column({ type: 'date', nullable: false })
    CreatedAt: Date;

    @Column({ type: 'boolean', default: true })
    IsActive: boolean;
}