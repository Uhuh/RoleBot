import { Interaction } from 'discord.js';

export const command = {
  name: 'list',
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    interaction.reply({
      ephemeral: true,
      content: 'Category-list responds.',
    });
  },
};
