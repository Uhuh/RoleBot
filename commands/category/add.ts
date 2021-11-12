import { Interaction } from 'discord.js';
import { Category } from '../../utilities/types/commands';

export const command = {
  name: 'add',
  desc: `Add reaction roles to a specific category.`,
  type: Category.category,
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    interaction.reply({
      ephemeral: true,
      content: 'Category-add-roles responds.',
    });
  },
};
