import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
} from 'discord.js';
import { TUTORIAL_VIDEO } from '../../src/vars';
import tutorialJson from '../../utilities/json/tutorial.json';
import { SlashCommand } from '../command';
import { tutorialEmbed } from '../../utilities/utilEmbedHelpers';

export class TutorialBaseCommand extends SlashCommand {
  readonly maxPage = tutorialJson['embeds'].length - 1;

  constructor() {
    super('tutorial', `Need to learn the basics of RoleBot? Use this command!`);
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
        .setStyle(ButtonStyle.Primary),
    );

    return buttons;
  };

  handleButton = async (
    interaction: ButtonInteraction,
    page: string,
    _args: string[],
  ) => {
    /* Should only be getting page ID's from the button event */
    const pageId = Number(page);

    const embed = tutorialEmbed(pageId);
    const buttons = this.makeButtons(pageId);

    interaction
      .update({
        embeds: [embed],
        components: [buttons],
      })
      .catch((e) =>
        this.log.error(
          `Failed to update tutorial interaction.\n${e}`,
          interaction.guildId,
        ),
      );
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    const embed = tutorialEmbed(0);

    const buttons = this.makeButtons(0);

    interaction
      .reply({
        ephemeral: true,
        content: `Hey! Let's get to learning.\n**Check out the [tutorial](${TUTORIAL_VIDEO})**\n`,
        embeds: [embed],
        components: [buttons],
      })
      .catch((e) =>
        this.log.error(
          `Failed to send tutorial embed.\n${e}`,
          interaction.guildId,
        ),
      );
  };
}
