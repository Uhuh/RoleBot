import { CacheType, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { GET_GUILD_JOIN_ROLES } from '../../../src/database/queries/joinRole.query';
import { SlashSubCommand } from '../../command';
import { joinRoleEmbed } from '../../../utilities/utilEmbedHelpers';

export class ListSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(baseCommand, 'list', 'See all auto join roles.');
  }

  execute = async (interaction: ChatInputCommandInteraction<CacheType>) => {
    if (!interaction.guildId) return;

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    const joinRoles = await GET_GUILD_JOIN_ROLES(interaction.guildId);

    const embed = joinRoleEmbed(joinRoles.map((r) => r.roleId));

    return interaction.editReply({
      embeds: [embed],
    });
  };
}
