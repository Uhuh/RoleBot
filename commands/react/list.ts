import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { GET_REACT_ROLES_BY_GUILD } from '../../src/database/queries/reactRole.query';
import { EmbedService } from '../../src/services/embedService';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import * as i18n from 'i18n';

export class ReactListCommand extends SlashCommand {
  constructor() {
    super(
      'react-list',
      'List all reaction roles that are currently active.',
      Category.react,
      [PermissionsBitField.Flags.ManageRoles]
    );
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;

    try {
      // Defer because of Discord rate limits.
      await interaction.deferReply({
        ephemeral: true,
      });
    } catch (e) {
      this.log.error(`Failed to defer interaction.\n${e}`, interaction.guildId);
      return;
    }

    const reactRoles = await GET_REACT_ROLES_BY_GUILD(interaction.guildId);

    if (!reactRoles || !reactRoles.length) {
      return interaction.editReply({
        content: i18n.__('REACT.LIST.FAILED'),
      });
    }

    const embed = EmbedService.reactRoleListEmbed(reactRoles);

    return interaction.editReply({
      content: i18n.__('REACT.LIST.SUCCESS'),
      embeds: [embed],
    });
  };
}
