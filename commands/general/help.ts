import {
  CommandInteraction,
  MessageActionRow,
  MessageEmbed,
  MessageSelectMenu,
  SelectMenuInteraction,
} from 'discord.js-light';
import { EmbedService } from '../../src/services/embedService';
import { Category } from '../../utilities/types/commands';
import { COLOR } from '../../utilities/types/globals';
import { SlashCommand } from '../slashCommand';
import RoleBot from '../../src/bot';

export class HelpCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(client, 'help', 'This command!', Category.general);
  }

  handleSelect = (interaction: SelectMenuInteraction, args: string[]) => {
    const [type] = args;

    const embed = EmbedService.helpEmbed(type, this.client);

    interaction
      .update({ embeds: [embed] })
      .catch(() =>
        this.log.error(
          `Error sending help embed for interaction. [${interaction.guildId}]`
        )
      );
  };

  execute = (interaction: CommandInteraction) => {
    const embed = new MessageEmbed();

    const { user } = interaction.client;
    if (!user) return;

    const selectMenu = new MessageActionRow().addComponents(
      new MessageSelectMenu()
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
      `Hey! I got a new look. **If you're unsure what to do check out \`/tutorial\`!!**\n\n\nThanks for using me! I know setting up reaction roles can be scary so here's some helpful descriptions for each commands!${''}\nI've broken them up by category for your convenience.`
    );

    interaction
      .reply({
        ephemeral: true,
        embeds: [embed],
        components: [selectMenu],
      })
      .catch((e) =>
        this.log.error(
          `Failed to defer interaction. Interaction timestamp: ${new Date(
            interaction.createdTimestamp
          )}\n${e}`
        )
      );
  };
}
