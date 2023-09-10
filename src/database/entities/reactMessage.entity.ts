import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, } from 'typeorm';
import { Category } from './category.entity';

export interface IReactMessage {
  guildId: string;
  messageId: string;
  channelId: string;
  roleId: string;
  emojiId: string;
  isCustomMessage: boolean;
  categoryId: number;
}

@Entity()
export class ReactMessage extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  isCustomMessage: boolean;

  @Column()
  messageId: string;

  @Column()
  channelId: string;

  @Column()
  emojiId: string;

  @Column()
  categoryId: number;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category?: Category;

  @Column()
  roleId: string;

  @Column()
  guildId: string;
}
