import { Interaction } from 'discord.js';
import { Category } from '../../utilities/types/commands';

export const list = {
  name: 'list',
  desc: `List all your categories and the roles within them.`,
  type: Category.category,
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    interaction.reply({
      ephemeral: true,
      content: 'Category-list responds.',
    });
  },
};
