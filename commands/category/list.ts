import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';
import { DataCommand, Category } from '../../utilities/types/commands';

export const list: DataCommand = {
  name: '/category-list',
  desc: `List all your categories and the roles within them.`,
  type: Category.category,
  data: new SlashCommandBuilder()
    .setName('category-list')
    .setDescription('List all your categories and the roles they hold!'),
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    interaction.reply({
      ephemeral: true,
      content: 'Category-list responds.',
    });
  },
};
