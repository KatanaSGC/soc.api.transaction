import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('TransactionPaymentMethod')
export class TransactionPaymentMethodEntity 
{
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'varchar', length: 120, nullable: false })
    PaymentMethodCode: string;

    @Column({ type: 'varchar', length: 13, nullable: false })
    Username: string;

    @Column({ type: 'int', nullable: false })
    TransactionPaymentStateId: number;

    @Column({ type: 'date', nullable: false })
    CreatedAt: Date;

    @Column({ type: 'boolean', default: true })
    IsActive: boolean;
}