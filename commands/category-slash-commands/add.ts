import { Interaction } from 'discord.js';

export const command = {
  name: 'add',
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    interaction.reply({
      ephemeral: true,
      content: 'Category-add-roles responds.',
    });
  },
};
