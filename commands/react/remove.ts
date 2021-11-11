import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('reactiondelete')
    .setDescription('Delete a reaction role.'),
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;
    /**
     * When user calls this command.
     * Prompt them if they want to add the role to an existing category.
     */

    const role = interaction.options.get('role')?.role;
    const emoji = interaction.options.get('emoji')?.value;

    console.log(`Role: ${role?.name} | Emoji: ${emoji}`);

    interaction.reply({
      ephemeral: true,
      content: 'Reaction role created.',
    });
  },
};
