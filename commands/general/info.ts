import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';
import { Category, DataCommand } from '../../utilities/types/commands';

export const info: DataCommand = {
  name: '/info',
  desc: `RoleBot's invite, ping, etc.`,
  type: Category.general,
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
