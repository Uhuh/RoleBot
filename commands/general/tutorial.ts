import { Interaction, MessageAttachment, MessageEmbed } from 'discord.js';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import * as fs from 'fs/promises';
import RoleBot from '../../src/bot';

export class TutorialCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'tutorial',
      'RoleBot can be confusing at times. Use this command to learn the flow.',
      Category.general
    );
  }

  execute = async (interaction: Interaction) => {
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
  };
}
