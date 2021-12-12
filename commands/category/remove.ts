import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';
import { DataCommand, Category } from '../../utilities/types/commands';

export const remove: DataCommand = {
  name: '/category-remove',
  desc: 'Delete a category. Deleting a category frees all roles it contains.',
  type: Category.category,
  data: new SlashCommandBuilder()
    .setName('category-remove')
    .setDescription('Remove a category.'),
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    interaction.reply({
      ephemeral: true,
      content: 'Category-remove responds.',
    });
  },
};
