import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('Transaction')
export class TransactionEntity {
    @PrimaryGeneratedColumn()
    Id: number;
    
    @Column({ type: 'varchar', length: 13, nullable: true })
    Username: string;

    @Column({ type: 'varchar', length: 8, nullable: true })
    TransactionCode: string;

    @Column({ type: 'varchar', length: 8, nullable: true })
    ShoppingCartCode: string;

    @Column({ type: 'decimal', precision: 13, scale: 4, nullable: false })
    Amount: number;

    @Column({ type: 'int', nullable: false })
    TransactionStateId: number;

    @Column({ type: 'boolean' })
    IsBuyTransaction: boolean;
    
    @Column({ type: 'date', nullable: false })
    CreatedAt: Date;

    @Column({ type: 'boolean', default: true })
    IsActive: boolean;
}