import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
} from 'discord.js';
import RoleBot from '../../src/bot';
import { EmbedService } from '../../src/services/embedService';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class TutorialCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'tutorial',
      `Need to learn the basics of RoleBot? Use this command!`,
      Category.general
    );
  }

  makeButtons = (pageId: number) => {
    const buttons = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId(`${this.name}_${pageId - 1}`)
        .setDisabled(pageId === 0)
        .setLabel('Back')
        .setStyle('SECONDARY'),
      new MessageButton()
        .setCustomId(`${this.name}_${pageId + 1}`)
        .setDisabled(pageId === 3)
        .setLabel('Next')
        .setStyle('PRIMARY')
    );

    return buttons;
  };

  handleButton = async (interaction: ButtonInteraction, args: string[]) => {
    /* Should only be getting page ID's from the button event */
    const [pageId] = args.map((p) => Number(p));

    const embed = EmbedService.tutorialEmbed(pageId);
    const buttons = this.makeButtons(pageId);

    interaction.update({
      embeds: [embed],
      components: [buttons],
    });
  };

  execute = async (interaction: CommandInteraction) => {
    const embed = EmbedService.tutorialEmbed(0);

    const buttons = this.makeButtons(0);

    interaction.reply({
      ephemeral: true,
      content: `Hey! Let's get to learning.`,
      embeds: [embed],
      components: [buttons],
    });
  };
}
