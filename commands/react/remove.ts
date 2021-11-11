import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction, MessageActionRow, MessageSelectMenu } from 'discord.js';
import { GET_REACT_ROLES_BY_GUILD } from '../../src/database/database';

export const command = {
  data: new SlashCommandBuilder()
    .setName('reactiondelete')
    .setDescription('Delete a reaction role.'),
  execute: async (interaction: Interaction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;

    const reactionRoles = await GET_REACT_ROLES_BY_GUILD(interaction.guildId);

    const selectMenu = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId('select-reactiondelete')
        .setPlaceholder('Select a reaction role to delete')
        .addOptions(
          reactionRoles.map((rr) => ({
            label: rr.roleName,
            description: `${rr.roleName} one of the reaction roles to delete.`,
            value: `rrdelete-${rr.roleId}`,
          }))
        )
    );

    const role = interaction.options.get('role')?.role;
    const emoji = interaction.options.get('emoji')?.value;

    console.log(`Role: ${role?.name} | Emoji: ${emoji}`);

    interaction.reply({
      ephemeral: true,
      content: 'Reaction role created.',
      components: [selectMenu],
    });
  },
};
