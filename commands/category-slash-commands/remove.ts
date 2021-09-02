import { Interaction } from 'discord.js';

export const command = {
  name: 'remove',

  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    interaction.reply({
      ephemeral: true,
      content: 'Category-remove responds.',
    });
  },
};
