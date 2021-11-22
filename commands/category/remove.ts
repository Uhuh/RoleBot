import { Interaction } from 'discord.js';
import { Category } from '../../utilities/types/commands';

export const remove = {
  name: 'remove',
  desc: 'Delete a category. Deleting a category frees all roles it contains.',
  type: Category.category,
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    interaction.reply({
      ephemeral: true,
      content: 'Category-remove responds.',
    });
  },
};
