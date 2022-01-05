import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export interface ICategory {
  guildId: string;
  name: string;
  description: string;
  mutuallyExclusive: boolean;
}

@Entity()
@Unique(['guildId'])
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  guildId!: string;

  @Column()
  name!: string;

  @Column()
  description?: string;

  @Column()
  mutuallyExclusive?: boolean;
}
