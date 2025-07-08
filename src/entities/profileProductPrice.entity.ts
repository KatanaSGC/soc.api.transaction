import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('ProfileProductPrice')
export class ProfileProductPriceEntity {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'int'})
    ProductId: number

    @Column({ type: 'int'})
    ProfileId: number

    @Column({ type: 'int', nullable: false })
    UnitTypeId: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
    Price: number;

    @Column({ type: 'date', nullable: false })
    CreatedAt: Date;

    @Column({ type: 'boolean', default: true })
    IsActive: boolean;
}

