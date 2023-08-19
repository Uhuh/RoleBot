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
  hideEmbed: boolean;
  hideEmojis: boolean;
}

@Entity()
export class GuildConfig extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  guildId: string;

  @Column({
    type: 'enum',
    enum: GuildReactType,
    default: GuildReactType.reaction,
  })
  reactType: GuildReactType;

  @Column({
    default: false,
  })
  hideEmbed: boolean;

  // If reactType is type button, then we can allow the ability to hide emojis in buttons.
  @Column({
    default: false,
  })
  hideEmojis: boolean;
}
