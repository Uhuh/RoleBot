import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { GuildReactType } from '../../src/database/entities/guild.entity';
import {
  CREATE_GUILD_CONFIG,
  EDIT_GUILD_CONFIG,
  GET_GUILD_CONFIG,
} from '../../src/database/queries/guild.query';
import { EmbedService } from '../../src/services/embedService';
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
    this.addBoolOption(
      'hide-emojis',
      'If using button react-type, you can hide the emojis for the buttons.'
    );
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const { guildId } = interaction;

    // If the config doesn't exist that means we failed to create it on join.
    let config = await GET_GUILD_CONFIG(guildId);
    if (!config) {
      config = await CREATE_GUILD_CONFIG(guildId);
    }

    const reactTypeString = interaction.options.getString('react-type');
    const reactType = parseGuildReactString(
      reactTypeString as keyof typeof GuildReactType
    );
    const hideEmojis = interaction.options.getBoolean('hide-emojis');

    await EDIT_GUILD_CONFIG(guildId, {
      reactType: reactTypeString ? reactType : config.reactType,
      hideEmojis: hideEmojis ?? config.hideEmojis,
    });

    const updatedConfig = this.expect(await GET_GUILD_CONFIG(guildId), {
      message: 'Failed to find server config!',
      prop: 'config',
    });

    const embed = await EmbedService.guildConfig(updatedConfig);

    return interaction.reply({
      ephemeral: true,
      content: `Heyo! Here's your new server configuration.`,
      embeds: [embed],
    });
  };
}
