import {
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Interaction,
  SelectMenuInteraction,
} from 'discord.js';
import { SUPPORT_URL } from '../vars';
import { LogService } from './logService';
import RoleBot from '../bot';
import { handleInteractionReply } from '../../utilities/utils';
import { ButtonHandler } from './buttonHandler';

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
      InteractionHandler.handleCommand(interaction, client).catch((e) =>
        this.log.error(`HandleCommand: ${e}`)
      );
    else if (interaction.isSelectMenu())
      InteractionHandler.handleSelect(interaction, client);
    else if (interaction.isButton())
      void InteractionHandler.handleButton(interaction, client);
    else if (interaction.isAutocomplete())
      InteractionHandler.handleAutocomplete(interaction, client).catch((e) =>
        this.log.error(`HandleAutocomplete: ${e}`)
      );
  }

  /**
   * This handles all base slash commands. These commands may invoke another interaction such as buttons or select menus.
   * @param interaction Base slash commands
   * @param client RoleBot to find the correct command.
   * @returns void, to exit the function early.
   */
  private static async handleCommand(
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
      await command.run(interaction);
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
   * Forward interactions autocomplete request to respective command.
   * @param interaction Interaction to respond to
   * @param client RoleBot client to find correct command to call its handleAutocomplete method.
   */
  private static async handleAutocomplete(
    interaction: AutocompleteInteraction,
    client: RoleBot
  ) {
    const command = client.commands.get(interaction.commandName.toLowerCase());

    if (!command) return;

    try {
      await command.handleAutoComplete(interaction);
    } catch (e) {
      this.log.error(
        `Encountered an error trying to run command[${command.name}]\n${e}`,
        interaction.guildId
      );
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
      const [commandName, subCommand, args] =
        this.extractCommandInfo(interaction);
      const command = client.commands.get(commandName);

      if (!command?.canUserRunInteraction(interaction)) {
        return this.log.debug(
          `User[${interaction.user.id}] selected option but does not have sufficient permissions to execute the commands[${commandName}] handleSelect`,
          interaction.guildId
        );
      }

      command?.handleSelect(interaction, subCommand, args);
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
  private static async handleButton(
    interaction: ButtonInteraction,
    client: RoleBot
  ) {
    try {
      const [commandName, subCommand, args] =
        this.extractCommandInfo(interaction);

      /**
       * If a user is pushing a button that's known as a react button
       * then the guild must be using button interactions instead of reactions.
       */
      if (commandName === 'react-button') {
        await interaction
          .deferReply({
            ephemeral: true,
          })
          .catch((e) => {
            this.log.error(
              `Failed to defer interaction for button react-role type.\n${e}`
            );
            return interaction.reply({
              ephemeral: true,
              content: `Failed to defer interaction! Oops?!?`,
            });
          });
        return ButtonHandler.handleButton(interaction, args);
      }

      const command = client.commands.get(commandName);

      if (!command?.canUserRunInteraction(interaction)) {
        return this.log.debug(
          `User[${interaction.user.id}] clicked a button but does not have sufficient permissions to execute the commands[${commandName}] handleButton.`,
          interaction.guildId
        );
      }

      await command.handleButton(interaction, subCommand, args);
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
    | ButtonInteraction
    | AutocompleteInteraction {
    return (
      interaction.isCommand() ||
      interaction.isSelectMenu() ||
      interaction.isButton() ||
      interaction.isAutocomplete()
    );
  }

  /**
   * Extract out the command name and the args (IDs) from the interaction.
   * They should follow a pattern: `commandName_subCommand_customIds1-customIds2-etc`
   * @param interaction SelectMenu or Button to extract commandName and args out of.
   * @returns Tuple [commandName, subCommand, commandArgs]
   */
  private static extractCommandInfo(
    interaction: SelectMenuInteraction | ButtonInteraction
  ): [string, string, string[]] {
    const [commandName, subCommand, commandArgs] = interaction.isSelectMenu()
      ? interaction.values.join('').split('_')
      : interaction.customId.split('_');

    return [commandName, subCommand, commandArgs.split('-')];
  }
}
