import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Look at all the current commands.'),
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    interaction.reply({
      ephemeral: true,
      content: 'Help responds.',
    });
  },
};
