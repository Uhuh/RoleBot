import {
  ActionRowBuilder,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder, MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import { TUTORIAL_VIDEO } from '../../src/vars';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../command';
import { helpEmbed } from '../../utilities/utilEmbedHelpers';

export class HelpBaseCommand extends SlashCommand {
  constructor() {
    super('help', 'This command!');
  }

  handleSelect = (
    interaction: StringSelectMenuInteraction,
    type: string,
    _args: string[],
  ) => {
    if (!(type in Category)) return;

    const embed = helpEmbed(type as Category);

    interaction
      .update({ embeds: [embed] })
      .catch(() =>
        this.log.error(
          `Error sending help embed for interaction.`,
          interaction.guildId,
        ),
      );
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    const embed = new EmbedBuilder();

    const { user } = interaction.client;
    if (!user) return;

    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
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
        ]),
    );

    embed
      .setTitle('Command Help')
      .setColor(Colors.Blurple)
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
      **Check out the [tutorial](${TUTORIAL_VIDEO})**\n
      **Want to host the bot yourself? Check out the [GitHub](https://github.com/Uhuh/RoleBot)**\n
      Thanks for using me! I know setting up reaction roles can be scary so here's some helpful descriptions for each commands!\nI've broken them up by category for your convenience.`,
    );

    interaction
      .reply({
        flags: MessageFlags.Ephemeral,
        embeds: [embed],
        components: [selectMenu],
      })
      .catch((e) =>
        this.log.error(
          `Failed to defer interaction. Interaction timestamp: ${new Date(
            interaction.createdTimestamp,
          )}\n${e}`,
          interaction.guildId,
        ),
      );
  };
}
