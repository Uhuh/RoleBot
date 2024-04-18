import { GuildConfig } from '../entities';
import { IGuildConfig } from '../entities/guild.entity';

export const GET_GUILD_CONFIG = (guildId: string) => {
  return GuildConfig.findOne({ where: { guildId } });
};

export const CREATE_GUILD_CONFIG = (guildId: string) => {
  const config = new GuildConfig();

  config.guildId = guildId;

  return config.save();
};

export const EDIT_GUILD_CONFIG = (
  guildId: string,
  guildConfig: Partial<IGuildConfig>,
) => {
  return GuildConfig.update({ guildId }, guildConfig);
};
