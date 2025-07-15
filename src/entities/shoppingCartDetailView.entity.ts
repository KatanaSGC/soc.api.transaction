import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('ShoppingCartDetailView')
export class ShoppingCartDetailViewEntity {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'int' })
    ShoppingCartId: number;

    @Column({ type: 'int' })
    ProductId: number;

    @Column({ type: 'int' })
    ProfileId: number;

    @Column({ type: 'varchar' })
    ProductName: string;

    @Column({ type: 'decimal', precision: 10, scale: 4, nullable: false })
    Amount: number;

    @Column({ type: 'varchar' })
    UnitType: string;

    @Column({ type: 'int' })
    UnitTypeId: number;

    @Column({ type: 'int' })
    Units: number;

    @Column({ type: 'varchar' })
    SellerUsername: string;
}

