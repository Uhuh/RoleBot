import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export interface ICategory {
  guildId: string;
  name: string;
  description?: string;
  mutuallyExclusive?: boolean;
  requiredRoleId: string | null;
}

@Entity()
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  guildId!: string;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column()
  mutuallyExclusive!: boolean;

  @Column({ type: 'text', nullable: true })
  requiredRoleId!: string | null;
}
