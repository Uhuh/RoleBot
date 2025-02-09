import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum DisplayType {
  alpha = 0,
  reversedAlpha,
  time,
  reversedTime,
}

export type ImageType = 'card' | 'thumbnail';

export interface ICategory {
  id: number;
  guildId: string;
  name: string;
  description?: string | null;
  displayRoles: boolean;
  mutuallyExclusive?: boolean;
  requiredRoleId: string | null;
  excludedRoleId: string | null;
  displayOrder: DisplayType;
  embedColor: string | null;
  imageUrl: string | null;
  imageType: ImageType;
}

@Entity()
export class Category extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  guildId: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: false })
  mutuallyExclusive: boolean;

  @Column({ default: true })
  displayRoles: boolean;

  @Column({ type: 'text', nullable: true })
  requiredRoleId: string | null;

  @Column({ type: 'text', nullable: true })
  excludedRoleId: string | null;

  @Column({
    type: 'enum',
    enum: DisplayType,
    default: DisplayType.alpha,
  })
  displayOrder: DisplayType;

  @Column({ type: 'text', nullable: true })
  embedColor: string | null;

  @Column({ type: 'text', nullable: true })
  imageUrl: string | null;

  @Column({
    type: 'text',
    default: 'card',
  })
  imageType: ImageType;
}
