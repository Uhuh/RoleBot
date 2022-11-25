import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
} from 'discord.js';
import { EmbedService } from '../../src/services/embedService';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import tutorialJson from '../../utilities/json/tutorial.json';
import { TUTORIAL_PLAYLIST } from '../../src/vars';

export class TutorialCommand extends SlashCommand {
  readonly maxPage = tutorialJson['embeds'].length - 1;

  constructor() {
    super(
      'tutorial',
      `Need to learn the basics of RoleBot? Use this command!`,
      Category.general
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

  handleButton = async (interaction: ButtonInteraction, args: string[]) => {
    /* Should only be getting page ID's from the button event */
    const [pageId] = args.map((p) => Number(p));

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

    await interaction.deferReply({
      ephemeral: true,
    });

    const buttons = this.makeButtons(0);

    interaction
      .editReply({
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
