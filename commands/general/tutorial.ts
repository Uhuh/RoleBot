import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
} from 'discord.js';
import { EmbedService } from '../../src/services/embedService';
import { TUTORIAL_PLAYLIST } from '../../src/vars';
import tutorialJson from '../../utilities/json/tutorial.json';
import { SlashCommand } from '../command';

export class TutorialBaseCommand extends SlashCommand {
  readonly maxPage = tutorialJson['embeds'].length - 1;

  constructor() {
    super(
      'tutorial',
      `Need to learn the basics of RoleBot? Use this command!`,
      []
    );
  }

  makeButtons = (pageId: number) => {
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${this.name}_${pageId - 1}`)
        .setDisabled(pageId === 0)
        .setLabel('Back')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`${this.name}_${pageId + 1}`)
        .setDisabled(pageId === this.maxPage)
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary)
    );

    return buttons;
  };

  handleButton = async (
    interaction: ButtonInteraction,
    page: string,
    _args: string[]
  ) => {
    /* Should only be getting page ID's from the button event */
    const pageId = Number(page);

    const embed = EmbedService.tutorialEmbed(pageId);
    const buttons = this.makeButtons(pageId);

    interaction
      .update({
        embeds: [embed],
        components: [buttons],
      })
      .catch((e) =>
        this.log.error(
          `Failed to update tutorial interaction.\n${e}`,
          interaction.guildId
        )
      );
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    const embed = EmbedService.tutorialEmbed(0);

    const buttons = this.makeButtons(0);

    interaction
      .reply({
        ephemeral: true,
        content: `Hey! Let's get to learning.\n**Want short form videos for help? Check out the [tutorial playlist](${TUTORIAL_PLAYLIST})**\n`,
        embeds: [embed],
        components: [buttons],
      })
      .catch((e) =>
        this.log.error(
          `Failed to send tutorial embed.\n${e}`,
          interaction.guildId
        )
      );
  };
}
