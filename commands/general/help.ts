import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  SelectMenuBuilder,
  SelectMenuInteraction,
} from 'discord.js';
import { EmbedService } from '../../src/services/embedService';
import { TUTORIAL_PLAYLIST } from '../../src/vars';
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

    await interaction.deferReply({
      ephemeral: true,
    });

    const { user } = interaction.client;
    if (!user) return;

    const selectMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
      new SelectMenuBuilder()
        .setCustomId(`select-${this.name}`)
        .setPlaceholder('Pick a category')
        .addOptions([
          {
            label: 'Category commands',
            description:
              'Want to categorize your reaction roles? Sort them with categories!',
            value: `${this.name}_${Category.category}`,
          },
          {
            label: 'Reaction role commands',
            description: `Manage your servers reaction roles with these commands.`,
            value: `${this.name}_${Category.react}`,
          },
          {
            label: 'General commands',
            description: 'Basic commands everyone can use!',
            value: `${this.name}_${Category.general}`,
          },
        ])
    );

    embed
      .setTitle('Command Help')
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

    embed.setDescription(
      `Hey! **If you've never used me before make sure to check out \`/tutorial\`! It'll explain how RoleBot works.**\n
      **Want short form videos for help? Check out the [tutorial playlist](${TUTORIAL_PLAYLIST})**\n
      **Want to host the bot yourself? Check out the [GitHub](https://github.com/Uhuh/RoleBot)**\n
      Thanks for using me! I know setting up reaction roles can be scary so here's some helpful descriptions for each commands!\nI've broken them up by category for your convenience.`
    );

    await interaction
      .editReply({
        embeds: [embed],
        components: [selectMenu],
      })
      .catch((e) =>
        this.log.error(
          `Failed to defer interaction. Interaction timestamp: ${new Date(
            interaction.createdTimestamp
          )}\n${e}`,
          interaction.guildId
        )
      );
  };
}
