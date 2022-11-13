import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum DisplayType {
  alpha = 0,
  reversedAlpha,
  time,
  reversedTime
}

export interface ICategory {
  guildId: string;
  name: string;
  description?: string | null;
  mutuallyExclusive?: boolean;
  requiredRoleId: string | null;
  displayOrder: DisplayType;
}

@Entity()
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  guildId!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column()
  mutuallyExclusive!: boolean;

  @Column({ type: 'text', nullable: true })
  requiredRoleId!: string | null;

  @Column({
    type: 'enum',
    enum: DisplayType,
    default: DisplayType.alpha
  })
  displayOrder!: DisplayType;
}
