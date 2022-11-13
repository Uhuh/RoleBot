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

  /* If it's a custom emoji this will be the 16 character ID, otherwise it'll be the unicode. */
  @Column()
  emojiId!: string;

  /* If the emoji is custom this will be the emoji mention. <(a?):name:id> Because emojis can be animated and Discord sucks. */
  @Column({ nullable: true })
  emojiTag?: string;

  @Column()
  guildId!: string;

  @Column()
  type!: ReactRoleType;

  @Column('int', { nullable: true })
  categoryId?: number;

  @ManyToOne(() => Category, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @Column({
    type: 'timestamp',
    default: new Date(),
  })
  categoryAddDate!: Date;
}
