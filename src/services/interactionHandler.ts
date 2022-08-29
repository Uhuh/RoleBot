import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Interaction,
  SelectMenuInteraction,
} from 'discord.js';
import { SUPPORT_URL } from '../vars';
import { LogService } from './logService';
import RoleBot from '../bot';
import { handleInteractionReply } from '../../utilities/utils';

export class InteractionHandler {
  public static log = new LogService('InteractionHandler');
  /**
   * Parse raw interactions and ensure they are handled correctly based on their type.
   * @param interaction Raw interaction. Determine what type it is and handle it.
   * @param client RoleBot client to pass to handlers to invoke correct command method.
   * @returns void to exit early.
   */
  public static handleInteraction(interaction: Interaction, client: RoleBot) {
    if (!InteractionHandler.isSupportedInteractionType(interaction)) {
      return this.log.debug(
        `Received interaction that is not one of the supported types.`,
        interaction.guildId
      );
    }

    if (interaction.isCommand())
      InteractionHandler.handleCommand(interaction, client);
    else if (interaction.isSelectMenu())
      InteractionHandler.handleSelect(interaction, client);
    else if (interaction.isButton())
      InteractionHandler.handleButton(interaction, client);
  }

  /**
   * This handles all base slash commands. These commands may invoke another interaction such as buttons or select menus.
   * @param interaction Base slash commands
   * @param client RoleBot to find the correct command.
   * @returns void, to exit the function early.
   */
  private static handleCommand(
    interaction: ChatInputCommandInteraction,
    client: RoleBot
  ) {
    const command = client.commands.get(interaction.commandName.toLowerCase());

    if (!command) return;
    else if (!command.canUserRunInteraction(interaction)) {
      return this.log.debug(
        `User[${interaction.user.id}] tried to run command[${command.name}] without sufficient permissions.`,
        interaction.guildId
      );
    }

    try {
      command.run(interaction);
    } catch (e) {
      this.log.error(
        `Encountered an error trying to run command[${command.name}]\n${e}`,
        interaction.guildId
      );

      handleInteractionReply(this.log, interaction, {
        content: 'There was an error while executing this command!',
        ephemeral: true,
      });
    }
  }

  /**
   * Parse selectmenu options and pass args to the correlating command.
   * @param interaction SelectMenu interaction to handle.
   * @param client RoleBot client to find correct command to call its handleSelect method.
   */
  private static handleSelect(
    interaction: SelectMenuInteraction,
    client: RoleBot
  ) {
    try {
      const [commandName, args] = this.extractCommandInfo(interaction);
      const command = client.commands.get(commandName);

      if (!command?.canUserRunInteraction(interaction)) {
        return this.log.debug(
          `User[${interaction.user.id}] selected option but does not have sufficient permissions to execute the commands[${commandName}] handleSelect`,
          interaction.guildId
        );
      }

      command?.handleSelect(interaction, args);
    } catch (e) {
      this.log.error(
        `An error occured with select[${interaction.customId}]\n${e}`,
        interaction.guildId
      );

      handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `I couldn't find that select option. Try again or report it to the [support server](${SUPPORT_URL}).`,
      });
    }
  }

  /**
   * Parse button clicked and pass args to the correlating command.
   * @param interaction Button interaction to handle.
   * @param client RoleBot client to find correct command to call its handleButton method.
   */
  private static handleButton(interaction: ButtonInteraction, client: RoleBot) {
    try {
      const [commandName, args] = this.extractCommandInfo(interaction);
      const command = client.commands.get(commandName);

      if (!command?.canUserRunInteraction(interaction)) {
        return this.log.debug(
          `User[${interaction.user.id}] clicked a button but does not have sufficient permissions to execute the commands[${commandName}] handleButton.`,
          interaction.guildId
        );
      }

      command.handleButton(interaction, args);
    } catch (e) {
      this.log.error(
        `An error occured with button[${interaction.customId}]\n${e}`,
        interaction.guildId
      );

      handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! I had issues trying to process that button click, please wait a moment and try again.`,
      });
    }
  }

  /**
   * Check if the raw interaction is a supported type.
   * @param interaction Raw interaction to check type of.
   * @returns If interaction is one of the supported types.
   */
  private static isSupportedInteractionType(
    interaction: Interaction
  ): interaction is
    | ChatInputCommandInteraction
    | SelectMenuInteraction
    | ButtonInteraction {
    return (
      interaction.isCommand() ||
      interaction.isSelectMenu() ||
      interaction.isButton()
    );
  }

  /**
   * Extract out the command name and the args (IDs) from the interaction.
   * They should follow a pattern: `commandName_customIds1-customIds2-etc`
   * @param interaction SelectMenu or Button to extract commandName and args out of.
   * @returns Tuple [commandName, commandArgs]
   */
  private static extractCommandInfo(
    interaction: SelectMenuInteraction | ButtonInteraction
  ): [string, string[]] {
    const [commandName, commandArgs] = interaction.isSelectMenu()
      ? interaction.values.join('').split('_')
      : interaction.customId.split('_');

    return [commandName, commandArgs.split('-')];
  }
}
