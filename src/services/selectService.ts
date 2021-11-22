import { Interaction, SelectMenuInteraction } from 'discord.js';
import RoleBot from '../bot';
import { Category } from '../../utilities/types/commands';
import { EmbedService } from './embedService';
import { SUPPORT_URL } from '../vars';
import { LogService } from './logService';

export class SelectService {
  /**
   * See what kind of selectmenu was used.
   * @param interaction SelectMenu Interaction to handle
   * @param client Rolebot client to pass to potential parsing functions.
   */
  public static parseSelection(
    interaction: SelectMenuInteraction,
    client: RoleBot
  ) {
    LogService.setPrefix('[SelectService]');

    const [type, value] = interaction.values.join('').split('-');

    switch (type) {
      case 'help':
        if (value in Category) {
          const embed = this.helpSelectParse(value, client);

          interaction
            .reply({ ephemeral: true, embeds: [embed] })
            .catch(() =>
              LogService.logError(
                `Error sending help embed for interaction. [${interaction.guildId}]`
              )
            );
        }
        break;

      default:
        interaction
          .reply({
            ephemeral: true,
            content: `I couldn't find that select option. Try again or report it to the [support server](${SUPPORT_URL}).`,
          })
          .catch(() =>
            LogService.logError(
              `Error telling user that I couldn't the selected dropdown.`
            )
          );
    }
  }

  /**
   * Check if an interaction is a selectmenu.
   * @param interaction Discord Interaction to validate if its a SelectMenu or not
   * @returns True if the interaction is a select menu
   */
  public static isSelectMenu(
    interaction: Interaction
  ): interaction is SelectMenuInteraction {
    return interaction.isSelectMenu();
  }

  /**
   * Generate a help embed with the guilds prefix and specific command type.
   * @param type @Category command type to filter by
   * @param guildId Guild ID to find prefix of.
   * @param client RoleBot client to find prefix and filter commands from.
   * @returns Generated help embed.
   */
  private static helpSelectParse(type: string, client: RoleBot) {
    return EmbedService.helpEmbed(type, client);
  }
}
