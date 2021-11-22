import { Interaction } from 'discord.js';
import { BaseCommand, Category } from '../../utilities/types/commands';

export const create: BaseCommand = {
  name: 'create',
  desc: `Create a new category to categorize your reaction roles in.`,
  type: Category.category,
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    interaction.reply({
      ephemeral: true,
      content: 'Category Create command',
    });
  },
};
