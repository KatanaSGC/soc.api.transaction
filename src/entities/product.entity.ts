import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('Product')
export class ProductEntity {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'varchar', length: 120 })
    Description: string;

    @Column({ type: 'int'})
    CategoryId: number

    @Column({ type: 'date', nullable: false })
    CreatedAt: Date;

    @Column({ type: 'boolean', default: true })
    IsActive: boolean;
}

