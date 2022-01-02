import {
  ButtonInteraction,
  CommandInteraction,
  Interaction,
  SelectMenuInteraction,
} from 'discord.js';
import { SUPPORT_URL } from '../vars';
import { LogService } from './logService';
import RoleBot from '../bot';

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
        `Received interaction that is not one of the supported types.`
      );
    }

    if (interaction.isCommand()) {
      return InteractionHandler.handleCommand(interaction, client);
    }

    if (interaction.isSelectMenu()) {
      return InteractionHandler.handleSelect(interaction, client);
    }

    if (interaction.isButton()) {
      return InteractionHandler.handleButton(interaction, client);
    }
  }

  /**
   * This handles all base slash commands. These commands may invoke another interaction such as buttons or select menus.
   * @param interaction Base slash commands
   * @param client RoleBot to find the correct command.
   * @returns void, to exit the function early.
   */
  private static handleCommand(
    interaction: CommandInteraction,
    client: RoleBot
  ) {
    const command = client.commands.get(interaction.commandName.toLowerCase());

    if (!command) return;
    else if (!command.canUserRunInteraction(interaction)) {
      return this.log.debug(
        `User[${interaction.user.id}] tried to run command[${command.name}] without sufficient permissions.`
      );
    }

    try {
      command.run(interaction);
    } catch (error) {
      this.log.error(
        `Encountered an error trying to run command[${command.name}] for guild[${interaction.guildId}]`
      );
      this.log.error(`${error}`);

      interaction.reply({
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
          `User[${interaction.user.id}] selected option but does not have sufficient permissions to execute the commands[${commandName}] handleSelect`
        );
      }

      command?.handleSelect(interaction, args);
    } catch {
      this.log.error(
        `An error occured with select[${interaction.customId}] in guild[${interaction.guildId}]`
      );

      interaction
        .reply({
          ephemeral: true,
          content: `I couldn't find that select option. Try again or report it to the [support server](${SUPPORT_URL}).`,
        })
        .catch(() =>
          this.log.error(
            `Error telling user that I couldn't use the selected dropdown.`
          )
        );
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
          `User[${interaction.user.id}] clicked a button but does not have sufficient permissions to execute the commands[${commandName}] handleButton.`
        );
      }

      command.handleButton(interaction, args);
    } catch (e) {
      this.log.error(
        `An error occured with button[${interaction.customId}] in guild[${interaction.guildId}]`
      );
      this.log.error(`${e}`);

      interaction
        .reply({
          ephemeral: true,
          content: `Hey! I had issues trying to process that button click, please wait a moment and try again.`,
        })
        .catch(() =>
          this.log.error(
            `Couldn't alert user that there was an error with the handleButton method.`
          )
        );
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
    | CommandInteraction
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
