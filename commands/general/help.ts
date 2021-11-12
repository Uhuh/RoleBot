import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';
import { Category } from '../../utilities/types/commands';

export const command = {
  name: '/help',
  desc: 'This command!',
  type: Category.general,
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
