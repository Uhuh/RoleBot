import { codeBlock, EmbedBuilder } from '@discordjs/builders';
import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Colors,
  MessageFlags,
  PermissionsBitField,
} from 'discord.js';
import { SlashCommand } from '../command';
import * as util from 'util';

const enum CommandOptionNames {
  Command = 'command',
}

export class EvalBaseCommand extends SlashCommand {
  developerIds = ['289151449412141076'];

  constructor() {
    super('eval', 'Devs only :)', [PermissionsBitField.Flags.ManageGuild]);

    this.addOption([
      {
        name: CommandOptionNames.Command,
        description: 'Command to run',
        required: true,
        type: ApplicationCommandOptionType.String,
      },
    ]);
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) return;
    const { member } = interaction;

    if (!this.developerIds.includes(member?.user.id ?? '')) {
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: `Nuhuhuh! You're not a dev!`,
      });

      return;
    }

    let content = interaction.options.getString(CommandOptionNames.Command);

    if (!content || content?.includes('TOKEN')) return;

    try {
      const output = eval(content);
      console.log(output);

      const embed = this.buildEmbed(`${content}\n\n${output}`);

      await interaction.reply({
        embeds: [embed],
      });
    } catch (e) {
      this.log.error(`Failed to run eval: ${e}`);

      const embed = this.buildEmbed(`${e}`, 'Error', Colors.Red);

      if (typeof content !== 'string')
        content = util.inspect(content, { depth: 0 });

      await interaction.reply({
        content: 'Oops!!!',
        embeds: [embed],
      });
    }
  };

  buildEmbed = (
    content: string,
    title = 'Output',
    color: number = Colors.Green,
  ) => {
    const embed = new EmbedBuilder();

    embed
      .setTitle(title)
      .setDescription(
        codeBlock(
          'js',
          content.length > 4096 ? content.substring(0, 4000) : content,
        ),
      )
      .setColor(color)
      .setTimestamp(new Date());

    return embed;
  };
}
