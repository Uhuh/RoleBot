import {
  CommandInteraction,
  MessageActionRow,
  MessageEmbed,
  MessageSelectMenu,
} from 'discord.js';
import { Category } from '../../utilities/types/commands';
import { COLOR } from '../../utilities/types/globals';
import { SlashCommand } from '../slashCommand';

export class HelpCommand extends SlashCommand {
  constructor() {
    super('help', 'This command!', Category.general);
  }

  execute = (interaction: CommandInteraction) => {
    const embed = new MessageEmbed();

    const { user } = interaction.client;
    if (!user) return;

    const selectMenu = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId('select-help')
        .setPlaceholder('Pick a category')
        .addOptions([
          {
            label: 'Category commands',
            description:
              'Want to categorize your reaction roles? Sort them with categories!',
            value: `help-${Category.category}`,
          },
          {
            label: 'Reaction role commands',
            description: `Manage your servers reaction roles with these commands.`,
            value: `help-${Category.react}`,
          },
          {
            label: 'General commands',
            description: 'Basic commands everyone can use!',
            value: `help-${Category.general}`,
          },
        ])
    );

    embed
      .setTitle('Command Help')
      .setColor(COLOR.AQUA)
      .setAuthor(user.username, user.avatarURL() || '')
      .setThumbnail(user.avatarURL() || '')
      .setFooter(`Replying to: ${interaction.member.user.username}`)
      .setTimestamp(new Date());

    embed.setDescription(
      `Thanks for using me! I know setting up reaction roles can be scary so here's some helpful descriptions for each commands!${''}\nI've broken them up by category for your convenience.`
    );

    interaction.reply({
      ephemeral: true,
      embeds: [embed],
      components: [selectMenu],
    });
  };
}
