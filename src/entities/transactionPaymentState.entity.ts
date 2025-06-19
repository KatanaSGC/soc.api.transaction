import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('TransactionPaymentState')
export class TransactionPaymentStateEntity {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'varchar', length: 120 })
    Description: string;

    @Column({ type: 'varchar', length: 5, unique: true })
    TransactionPaymentStateCode: string;

    @Column({ type: 'date', nullable: false })
    CreatedAt: Date;

    @Column({ type: 'boolean', default: true })
    IsActive: boolean;
}