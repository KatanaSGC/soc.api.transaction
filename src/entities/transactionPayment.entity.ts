import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('TransactionPayment')
export class TransactionPaymentEntity {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'int', nullable: false })
    TransactionId: number;
    
    @Column({ type: 'varchar', length: 6, nullable: false })
    TransactionUnlockCode: string;

    @Column({ type: 'varchar', length: 6, nullable: false })
    PaymentReferenceCode: string;

    @Column({ type: 'int', nullable: false })
    TransactionPaymentStateId: number;

    @Column({ type: 'boolean', default: true })
    IsStripePayment: boolean;

    @Column({ type: 'date', nullable: false })
    CreatedAt: Date;

    @Column({ type: 'boolean', default: true })
    IsActive: boolean;
}