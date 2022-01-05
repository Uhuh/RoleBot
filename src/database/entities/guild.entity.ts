import { BaseEntity, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class GuildConfig extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: string;
}
