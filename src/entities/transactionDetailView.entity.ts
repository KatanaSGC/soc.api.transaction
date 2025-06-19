import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('TransactionDetailView')
export class TransactionDetailView {
    @PrimaryGeneratedColumn()
    Id: number;

    @Column({ type: 'varchar' })
    BuyerUsername: string;

    @Column({ type: 'varchar' })
    SellerUsername: string;

    @Column({ type: 'varchar' })
    TransactionCode: string;    

    @Column({ type: 'varchar' })
    ProductDescription: string;    
    
    @Column({ type: 'int' })
    ProductUnits: number;

    @Column({ type: 'decimal' })
    AmountOffered: number;

    @Column({ type: 'varchar' })
    BuyerNames: string;

    @Column({ type: 'varchar' })
    BuyerSurnames: string;
    
    @Column({ type: 'varchar' })
    BuyerEmail: string;
    
    @Column({ type: 'varchar' })
    BuyerPhone: string;    

    @Column({ type: 'varchar' })
    SellerNames: string;

    @Column({ type: 'varchar' })
    SellerSurnames: string;
    
    @Column({ type: 'varchar' })
    SellerEmail: string;
    
    @Column({ type: 'varchar' })
    SellerPhone: string;      

    @Column({ type: 'varchar' })
    TransactionState: string;          
}