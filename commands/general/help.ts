import { SlashCommandBuilder } from '@discordjs/builders';
import {
  Interaction,
  MessageActionRow,
  MessageEmbed,
  MessageSelectMenu,
} from 'discord.js';
import RoleBot from '../../src/bot';
import { Category, DataCommand } from '../../utilities/types/commands';
import { COLOR } from '../../utilities/types/globals';

export const help: DataCommand = {
  name: '/help',
  desc: 'This command!',
  type: Category.general,
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Look at all the current commands.'),
  execute: (interaction: Interaction, client: RoleBot) => {
    if (!interaction.isCommand()) return;

    const embed = new MessageEmbed();

    const { user } = client;
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
  },
};
