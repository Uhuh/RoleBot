import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ReactRole } from './reactRole.entity';

@Entity()
export class LinkedRole extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  guildId: string;

  @Column()
  roleId: string;

  @ManyToOne(() => ReactRole, (reactRole) => reactRole.linkedRoles)
  reactRole: ReactRole;
}