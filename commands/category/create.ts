import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';
import { DataCommand, Category } from '../../utilities/types/commands';

export const create: DataCommand = {
  name: '/category-create',
  desc: `Create a new category to categorize your reaction roles in.`,
  type: Category.category,
  data: new SlashCommandBuilder()
    .setName('category-create')
    .setDescription('Create a new category to store reaction roles in!')
    .addStringOption((option) =>
      option
        .setName('category-name')
        .setDescription('The name of the category.')
        .setRequired(true)
    ),
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    interaction.reply({
      ephemeral: true,
      content: 'Category Create command',
    });
  },
};
