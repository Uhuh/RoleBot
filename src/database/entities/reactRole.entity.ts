import {
  BaseEntity,
  Column,
  Entity,
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
  id!: string;

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

  @ManyToOne(() => Category)
  category?: Category;
}
