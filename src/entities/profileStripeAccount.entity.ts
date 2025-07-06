import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('ProfileStripeAccount')
export class ProfileStripeAccountEntity {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'int'})
    ProfileId: number

    @Column({ type: 'varchar', length: 64 })
    StripeAccountId: string;

    @Column({ type: 'varchar', length: 256 })
    StripeEmail: string;

    @Column({ type: 'varchar', length: 512 })
    StripeName: string;

    @Column({ type: 'date', nullable: false })
    CreatedAt: Date;

    @Column({ type: 'boolean', default: true })
    IsActive: boolean;
}

