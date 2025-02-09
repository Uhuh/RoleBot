import {
  BaseEntity,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';import { Category } from './category.entity';
import { LinkedRole } from './link.entity';

export enum ReactRoleType {
  normal = 1,
  addOnly,
  removeOnly,
}

@Entity()
export class ReactRole extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  roleId: string;

  /* If it's a custom emoji this will be the 16 character ID, otherwise it'll be the unicode. */
  @Column()
  emojiId: string;

  /* If the emoji is custom this will be the emoji mention. <(a?):name:id> Because emojis can be animated and Discord sucks. */
  @Column({ type: 'character varying', nullable: true })
  emojiTag: string | null;

  @Column()
  guildId: string;

  @Column()
  type: ReactRoleType;

  @Column('int', { nullable: true })
  categoryId?: number;

  @ManyToOne(() => Category, { onDelete: 'SET NULL' })
  @JoinTable()
  category?: Category;

  @ManyToMany(() => LinkedRole, (linkedRoles) => linkedRoles.reactRole, { cascade: true })
  @JoinTable()
  linkedRoles: LinkedRole[];

  @Column({
    type: 'timestamp',
    default: new Date(),
  })
  categoryAddDate: Date;
}
