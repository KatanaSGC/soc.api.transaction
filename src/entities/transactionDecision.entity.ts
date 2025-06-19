import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("TransactionDecision")
export class TransactionDecisionEntity 
{
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'int', nullable: false })
    TransactionId: number;

    @Column({ type: 'varchar', length: 256 })
    Username: string;

    @Column({ type: 'boolean', default: true })
    IsAccepted: boolean;

    @Column({ type: 'int', nullable: false })
    Version: number;

    @Column({ type: 'date', nullable: false })
    CreatedAt: Date;

    @Column({ type: 'boolean', default: true })
    IsActive: boolean;
}