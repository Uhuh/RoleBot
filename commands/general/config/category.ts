import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js';
import { GuildReactType } from '../../../src/database/entities/guild.entity';
import {
  CREATE_GUILD_CONFIG,
  EDIT_GUILD_CONFIG,
  GET_GUILD_CONFIG,
} from '../../../src/database/queries/guild.query';
import { EmbedService } from '../../../src/services/embedService';
import {
  getGuildReactConfigValues,
  parseGuildReactString,
} from '../../../utilities/utils';
import { SlashSubCommand } from '../../command';

export class CategorySubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(
      baseCommand,
      'category',
      'Change how categories and their react roles display.',
      [
        {
          name: 'react-type',
          description: 'Change how RoleBot serves react roles.',
          type: ApplicationCommandOptionType.String,
          choices: getGuildReactConfigValues(),
        },
        {
          name: 'hide-emojis',
          description:
            'If using button react-type, you can hide the emojis for the buttons.',
          type: ApplicationCommandOptionType.Boolean,
        },
        {
          name: 'hide-embed',
          description:
            'Change if RoleBot uses an embed or just a normal message.',
          type: ApplicationCommandOptionType.Boolean,
        },
      ]
    );
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    await interaction.deferReply({
      ephemeral: true,
    });

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
    const hideEmbed = interaction.options.getBoolean('hide-embed');

    await EDIT_GUILD_CONFIG(guildId, {
      reactType: reactTypeString ? reactType : config.reactType,
      hideEmbed: hideEmbed ?? config.hideEmbed,
      hideEmojis: hideEmojis ?? config.hideEmojis,
    });

    const updatedConfig = this.expect(await GET_GUILD_CONFIG(guildId), {
      message: 'Failed to find server config!',
      prop: 'config',
    });

    const embed = await EmbedService.guildConfig(updatedConfig);

    return interaction.editReply({
      content: `Hey! Here's your new server configuration.`,
      embeds: [embed],
    });
  };
}
