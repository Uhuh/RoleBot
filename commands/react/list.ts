import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';
import { Category } from '../../utilities/types/commands';

export const command = {
  name: '/listroles',
  desc: `List all reaction roles that are currently in your server.`,
  type: Category.react,
  data: new SlashCommandBuilder()
    .setName('listroles')
    .setDescription('List all your reaction roles.'),
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;
    /**
     * When user calls this command.
     * Prompt them if they want to add the role to an existing category.
     */

    const role = interaction.options.get('role')?.role;
    const emoji = interaction.options.get('emoji')?.value;

    LogService.logInfo(`Role: ${role?.name} | Emoji: ${emoji}`);

    interaction.reply({
      ephemeral: true,
      content: 'Reaction role created.',
    });
  },
};
