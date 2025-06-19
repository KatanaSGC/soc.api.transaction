import { Column, Entity, PrimaryGeneratedColumn, Table } from "typeorm";

@Entity('ProfileProduct')
export class ProfileProductEntity {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'int', nullable: false })
    ProfileId: number;

    @Column({ type: 'int', nullable: false })
    ProductId: number;

    @Column({ type: 'int', nullable: false })
    UnitTypeId: number;

    @Column({ type: 'int', nullable: false })
    Units: number;

    @Column({ type: 'date', nullable: false })
    CreatedAt: Date;

    @Column({ type: 'boolean', default: true })
    IsActive: boolean;
}