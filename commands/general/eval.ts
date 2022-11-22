import { codeBlock, EmbedBuilder } from '@discordjs/builders';
import { ChatInputCommandInteraction, Colors } from 'discord.js';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import * as util from 'util';

export class EvalCommand extends SlashCommand {
  constructor() {
    super('eval', 'Devs only :)', Category.owner);
    this.addStringOption('command', 'Command to run', true);
  }

  developerIds = ['658441101861978151', '289151449412141076'];

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) return;
    const { member } = interaction;

    if (!this.developerIds.includes(member?.user.id ?? '')) {
      return interaction.reply({
        ephemeral: true,
        content: `Nuhuhuh! You're not a dev!`,
      });
    }

    let content = interaction.options.getString('command');

    if (!content || content?.includes('TOKEN')) return;

    try {
      const output = eval(content);
      console.log(output);

      const embed = this.buildEmbed(output);

      return interaction.reply({
        embeds: [embed],
      });
    } catch (e) {
      this.log.error(`Failed to run eval: ${e}`);

      const embed = this.buildEmbed(`${e}`, 'Error', Colors.Red);

      if (typeof content !== 'string')
        content = util.inspect(content, { depth: 0 });

      return interaction.reply({
        content: 'Oops!!!',
        embeds: [embed],
      });
    }
  };

  buildEmbed = (
    content: string,
    title = 'Output',
    color: number = Colors.Green
  ) => {
    const embed = new EmbedBuilder();

    embed
      .setTitle(title)
      .setDescription(
        codeBlock(
          'js',
          content.length > 4096 ? content.substring(0, 4000) : content
        )
      )
      .setColor(color)
      .setTimestamp(new Date());

    return embed;
  };
}
