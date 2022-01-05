import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from './category.entity';

export interface IReactMessage {
  guildId: string;
  messageId: string;
  channelId: string;
  roleId: string;
  emojiId: string;
  categoryId: string;
}

@Entity()
export class ReactMessage extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  messageId!: string;

  @Column()
  channelId!: string;

  @Column()
  emojiId!: string;

  @ManyToOne(() => Category)
  category!: Category;

  @Column()
  roleId!: string;

  @Column()
  guildId!: string;
}
