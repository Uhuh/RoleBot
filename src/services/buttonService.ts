import { ButtonInteraction } from 'discord.js';
import RoleBot from '../bot';
import { SUPPORT_URL } from '../vars';
import { LogService } from './logService';

export class ButtonService {
  public static parseButton(interaction: ButtonInteraction, client: RoleBot) {
    LogService.setPrefix('ButtonService');

    /** How should buttons be formatted?
     * @format - method-answer-primary_id-secondary_id
     * @example - message-yes-1234-5678
     */

    const [method, answer, ...args] = interaction.customId.split('-');

    switch (method) {
      case 'message':
        break;
      default:
        LogService.error(
          `A nonexistent button[${interaction.customId}] was clicked in guild[${interaction.guildId}] `
        );

        interaction
          .reply({
            ephemeral: true,
            content: `I couldn't find a button with that option. Try again or report it to the [support server](${SUPPORT_URL})`,
          })
          .catch(() =>
            LogService.error(
              `Error telling user that I couldn't use the button clicked.`
            )
          );
    }
  }
}
