import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { GuildReactType } from '../../src/database/entities/guild.entity';
import {
  CREATE_GUILD_CONFIG,
  EDIT_GUILD_CONFIG,
  GET_GUILD_CONFIG,
} from '../../src/database/queries/guild.query';
import { Category } from '../../utilities/types/commands';
import {
  getGuildReactConfigValues,
  parseGuildReactString,
} from '../../utilities/utils';
import { SlashCommand } from '../slashCommand';

export class ConfigCommand extends SlashCommand {
  constructor() {
    super(
      'config',
      'Edit the servers reaction configurations.',
      Category.general,
      [PermissionsBitField.Flags.ManageGuild]
    );

    this.addStringOption(
      'react-type',
      'Change how the bot serves react roles.',
      false,
      getGuildReactConfigValues()
    );
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const { guildId } = interaction;

    // If the config doesn't exist that means we failed to create it on join.
    let guildConfig = await GET_GUILD_CONFIG(guildId);
    if (!guildConfig) {
      guildConfig = CREATE_GUILD_CONFIG(guildId);
    }

    const reactTypeString = interaction.options.getString('react-type');
    const reactType = parseGuildReactString(
      reactTypeString as keyof typeof GuildReactType
    );

    await EDIT_GUILD_CONFIG(guildId, {
      reactType,
    });
  };
}
