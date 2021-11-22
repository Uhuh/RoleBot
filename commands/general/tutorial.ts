import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction, MessageAttachment, MessageEmbed } from 'discord.js';
import RoleBot from '../../src/bot';
import { Category, DataCommand } from '../../utilities/types/commands';
import * as fs from 'fs/promises';

export const tutorial: DataCommand = {
  desc: 'RoleBot can be confusing at times. Use this command to learn the flow.',
  name: 'tutorial',
  type: Category.general,
  data: new SlashCommandBuilder()
    .setName('tutorial')
    .setDescription(
      'RoleBot can be confusing at times. Use this command to learn the flow.'
    ),
  execute: async (interaction: Interaction, client: RoleBot) => {
    if (!interaction.isCommand()) return;
    const image = await fs.readFile('assets/banner.png');
    const embed = new MessageEmbed()
      .setTitle(`Hello World`)
      .setDescription('Going to make a tutorial here.')
      .setImage('attachment://banner.png');

    interaction.deferReply({ ephemeral: false });

    interaction.followUp({
      embeds: [embed],
      files: [new MessageAttachment(image, 'banner.png')],
    });
  },
};
