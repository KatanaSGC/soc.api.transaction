import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('Transaction')
export class TransactionEntity {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'varchar', length: 13, nullable: true })
    SellerUsername: string;
    
    @Column({ type: 'varchar', length: 13, nullable: true })
    BuyerUsername: string;

    @Column({ type: 'varchar', length: 8, nullable: true })
    TransactionCode: string;

    @Column({ type: 'varchar', length: 120, nullable: false })
    ProductDescription: string;

    @Column({ type: 'int', nullable: false })
    ProductUnits: number;

    @Column({ type: 'decimal', precision: 13, scale: 4, nullable: false })
    AmountOffered: number;

    @Column({ type: 'int', nullable: false })
    TransactionStateId: number;

    @Column({ type: 'int', nullable: false })
    ProductId: number;
    
    @Column({ type: 'date', nullable: false })
    CreatedAt: Date;

    @Column({ type: 'boolean', default: true })
    IsActive: boolean;
}