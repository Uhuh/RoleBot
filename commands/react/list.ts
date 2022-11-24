import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { GET_REACT_ROLES_BY_GUILD } from '../../src/database/queries/reactRole.query';
import { EmbedService } from '../../src/services/embedService';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

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

    await interaction.deferReply({
      ephemeral: true,
    });

    const reactRoles = await GET_REACT_ROLES_BY_GUILD(interaction.guildId);

    if (!reactRoles || !reactRoles.length) {
      return interaction.editReply({
        content: `Hey! Turns out this server doesn't have any react roles setup. Start creating some with \`/react-role\`!`,
      });
    }

    const embed = EmbedService.reactRoleListEmbed(reactRoles);

    return interaction.editReply({
      content: `Hey! Here's your react roles. If you notice any \`@deleted\` roles run \`/react-clean\` to remove them.`,
      embeds: [embed],
    });
  };
}
