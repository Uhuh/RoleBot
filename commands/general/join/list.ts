import { ChatInputCommandInteraction, CacheType } from 'discord.js';
import { GET_GUILD_JOIN_ROLES } from '../../../src/database/queries/joinRole.query';
import { EmbedService } from '../../../src/services/embedService';
import { SlashSubCommand } from '../../command';

export class ListSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(baseCommand, 'list', 'See all auto join roles.');
  }

  execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
    if (!interaction.guildId) return;

    await interaction.deferReply({
      ephemeral: true,
    });

    const joinRoles = await GET_GUILD_JOIN_ROLES(interaction.guildId);

    const embed = EmbedService.joinRoleEmbed(joinRoles.map((r) => r.roleId));

    return interaction.editReply({
      embeds: [embed],
    });
  };
}
