import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SelectMenuBuilder,
  SelectMenuInteraction,
} from 'discord.js';
import { EmbedService } from '../../src/services/embedService';
import { Category } from '../../utilities/types/commands';
import { COLOR } from '../../utilities/types/globals';
import { SlashCommand } from '../slashCommand';

export class HelpCommand extends SlashCommand {
  constructor() {
    super('help', 'This command!', Category.general);
  }

  handleSelect = (interaction: SelectMenuInteraction, args: string[]) => {
    const [type] = args;

    if (!(type in Category)) return;

    const embed = EmbedService.helpEmbed(type as Category);

    interaction
      .update({ embeds: [embed] })
      .catch(() =>
        this.log.error(
          `Error sending help embed for interaction.`,
          interaction.guildId
        )
      );
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    const embed = new EmbedBuilder();

    const { user } = interaction.client;
    if (!user) return;

    const selectMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
      new SelectMenuBuilder()
        .setCustomId(`select-${this.name}`)
        .setPlaceholder(i18n.__('GENERAL.HELP.OPTIONS.PLACEHOLDER'))
        .addOptions([
          {
            label: i18n.__('GENERAL.HELP.OPTIONS.CATEGORY.LABEL'),
            description: i18n.__('GENERAL.HELP.OPTIONS.CATEGORY.DESCRIPTION'),
            value: `${this.name}_${Category.category}`,
          },
          {
            label: i18n.__('GENERAL.HELP.OPTIONS.REACT.LABEL'),
            description: i18n.__('GENERAL.HELP.OPTIONS.REACT.DESCRIPTION'),
            value: `${this.name}_${Category.react}`,
          },
          {
            label: i18n.__('GENERAL.HELP.OPTIONS.GENERAL.LABEL'),
            description: i18n.__('GENERAL.HELP.OPTIONS.GENERAL.DESCRIPTION'),
            value: `${this.name}_${Category.general}`,
          },
        ])
    );

    embed
      .setTitle(i18n.__('GENERAL.HELP.TITLE'))
      .setColor(COLOR.DEFAULT)
      .setAuthor({
        name: user.username,
        iconURL: user.avatarURL() || '',
        url: 'https://rolebot.gg',
      })
      .setThumbnail(user.avatarURL() || '')
      .setFooter({
        text: `Replying to: ${interaction.member?.user.username}`,
      })
      .setTimestamp(new Date());

    embed.setDescription(i18n.__('GENERAL.HELP.DESCRIPTION'));

    await interaction.reply({
      ephemeral: true,
      embeds: [embed],
      components: [selectMenu],
    });
  };
}
