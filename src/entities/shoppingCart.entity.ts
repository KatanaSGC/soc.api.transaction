import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('ShoppingCart')
export class ShoppingCartEntity {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'int'})
    BuyerProfileId: number;

    @Column({ type: 'varchar', length: 8 })
    ShoppingCartCode: string;

    @Column({ type: 'decimal', precision: 10, scale: 4, nullable: false })
    Amount: number;

    @Column({ type: 'boolean', default: true })
    IsOpen: boolean;

    @Column({ type: 'date', nullable: false })
    CreatedAt: Date;

    @Column({ type: 'boolean', default: true })
    IsActive: boolean;
}

