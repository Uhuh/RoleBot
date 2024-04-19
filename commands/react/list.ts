import { ChatInputCommandInteraction } from 'discord.js';
import { GET_REACT_ROLES_BY_GUILD } from '../../src/database/queries/reactRole.query';
import { SlashSubCommand } from '../command';
import { reactRoleListEmbed } from '../../utilities/utilEmbedHelpers';

export class ListSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(
      baseCommand,
      'list',
      'List all reaction roles that are currently active.',
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
        content: `Hey! Turns out this server doesn't have any react roles setup. Start creating some with \`/react create\`!`,
      });
    }

    const embed = reactRoleListEmbed(reactRoles);

    return interaction.editReply({
      content: `Hey! Here's your react roles. If you notice any \`@deleted\` roles run \`/react clean\` to remove them.`,
      embeds: [embed],
    });
  };
}
