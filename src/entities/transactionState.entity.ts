import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('TransactionState')
export class TransactionStateEntity {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'varchar', length: 120 })
    Description: string;

    @Column({ type: 'varchar', length: 5, unique: true })
    TransactionStateCode: string;

    @Column({ type: 'date', nullable: false })
    CreatedAt: Date;

    @Column({ type: 'boolean', default: true })
    IsActive: boolean;
}