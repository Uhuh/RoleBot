import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Bot info, invite, and general stats.'),
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    interaction.reply({
      ephemeral: true,
      content: 'Info responds.',
    });
  },
};
