import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class TransactionPaymentDocumentEntity 
{
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'varchar', length: 256 })
    FIlePath: string;

    @Column({ type: 'int', nullable: false })
    TransactionPaymentId: number;

    @Column({ type: 'date', nullable: false })
    CreatedAt: Date;

    @Column({ type: 'boolean', default: true })
    IsActive: boolean;
}