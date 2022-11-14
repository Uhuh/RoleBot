import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum GuildReactType {
  reaction = 0,
  button,
  select,
}

export interface IGuildConfig {
  id: number;
  guildId: string;
  reactType: GuildReactType;
}

@Entity()
export class GuildConfig extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  guildId!: string;

  @Column({
    type: 'enum',
    enum: GuildReactType,
    default: GuildReactType.reaction,
  })
  reactType!: GuildReactType;
}
