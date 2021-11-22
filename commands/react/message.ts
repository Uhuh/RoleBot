import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';
import { Category, DataCommand } from '../../utilities/types/commands';

export const reactMessage: DataCommand = {
  name: '/reaction-message',
  desc: 'Have a custom message you want rolebot to react to? Pass the message ID and select the category and RoleBot will handle it!',
  type: Category.react,
  data: new SlashCommandBuilder()
    .setName('reaction-message')
    .setDescription('Set a custom message for your reaction roles.'),
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
