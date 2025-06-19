import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('Profile')
export class ProfileEntity {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: 'varchar', length: 240 })
  Names: string;

  @Column({ type: 'varchar', length: 240 })
  Surnames: string;

  @Column({ type: 'varchar', length: 120 })
  Email: string;

  @Column({ type: 'varchar', length: 120 })
  Identify: string;

  @Column({ type: 'varchar', length: 9, nullable: true })
  Phone?: string;

  @Column({ type: 'date', nullable: false })
  BirthDate: Date;

  @Column({ type: 'date', nullable: false })
  CreatedAt: Date;

  @Column({ type: 'boolean', default: true })
  IsActive: boolean;
}
