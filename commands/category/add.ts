import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';
import { Category, DataCommand } from '../../utilities/types/commands';

export const add: DataCommand = {
  name: '/category-add',
  desc: `Add reaction roles to a specific category.`,
  type: Category.category,
  data: new SlashCommandBuilder()
    .setName('category-add')
    .setDescription('Add roles to your category to manage the roles easier!'),
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    interaction.reply({
      ephemeral: true,
      content: 'Category-add-roles responds.',
    });
  },
};
