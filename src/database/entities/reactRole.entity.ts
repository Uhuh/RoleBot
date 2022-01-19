import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from './category.entity';

export enum ReactRoleType {
  normal = 1,
  addOnly,
  removeOnly,
}

@Entity()
export class ReactRole extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  roleId!: string;

  @Column()
  emojiId!: string;

  @Column()
  guildId!: string;

  @Column()
  type!: ReactRoleType;

  @Column('int', { nullable: true })
  categoryId?: number;

  @ManyToOne(() => Category, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;
}
