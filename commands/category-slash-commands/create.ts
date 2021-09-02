import { Interaction } from 'discord.js';

export const command = {
  name: 'create',
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    interaction.reply({
      ephemeral: true,
      content: 'D.JS slash command worked haha',
    });
  },
};
