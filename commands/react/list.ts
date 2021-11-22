import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';
import { Category, DataCommand } from '../../utilities/types/commands';

export const reactList: DataCommand = {
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

    interaction.reply({
      ephemeral: true,
      content: 'Reaction role created.',
    });
  },
};
