import {
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  SelectMenuInteraction,
} from 'discord.js';
import { CustomError } from '../src/error/custom.error';
import { LogService } from '../src/services/logService';
import { handleInteractionReply } from '../utilities/utils';
import { PermissionMappings } from './command';

export class CommandHandlers {
  public log: LogService;

  constructor(public name: string, public baseName = '') {
    this.log = new LogService(`${baseName ? baseName + ' ' : ''}${name}`);
  }

  /**
   * This method should be overwritten by the child class and implement the commands functionality.
   * @param interaction Command that was ran and handed to this command from the handleInteraction function.
   */
  public execute = async (
    interaction: ChatInputCommandInteraction
  ): Promise<unknown> => {
    return handleInteractionReply(
      this.log,
      interaction,
      `Hey! Turns out you didn't implement this command[${this.name}] yet. How about you do that?`
    );
  };

  /**
   * This method should be overwritten by the child class and implement the handling for any option passed.
   *
   * All options should be keyed with the commands name followed by any IDs it needs separated by a `_`
   * `_` because the slash commands have to use `-`
   * @param interaction SelectMenu option that was clicked.
   * @param _args Essentially all the IDs that are separated with `-`
   */
  public handleSelect = (
    interaction: SelectMenuInteraction,
    subCommand: string,
    _args: string[]
  ) => {
    handleInteractionReply(
      this.log,
      interaction,
      `Hey! Turns out you didn't implement this commands[${this.name} ${subCommand}] dropdown handler yet. How about you do that?`
    );
  };

  /**
   * This method should be overwritten by the child class and implement the handling for any option passed.
   * @param interaction Button that was clicked
   * @param args IDs that are inside the buttons customId
   */
  public handleButton = async (
    interaction: ButtonInteraction,
    subCommand: string,
    _args: string[]
  ): Promise<unknown> => {
    return handleInteractionReply(
      this.log,
      interaction,
      `Hey! Turns out you didn't implement this commands[${this.name} ${subCommand}] button handler yet. How about you do that?`
    );
  };

  /**
   * This method should respond with data related to the command.
   * @param interaction Interaction to give data to
   */
  public handleAutoComplete = async (interaction: AutocompleteInteraction) => {
    return interaction.respond([
      { name: 'Hey! You forgot to implement autocomplete!', value: 'oops' },
    ]);
  };

  /**
   * Expect any value passed into here shouldn't be null, otherwise alert the user.
   * @param value Any entity or value we want to check.
   * @param props Message to alert user and prop for logging.
   * @returns value if not null
   */
  expect = <T>(
    value: T | null | undefined,
    props: { message: string; prop: string }
  ): T => {
    if (value === null || value === undefined) {
      this.log.error(`Expected ${props.prop} to not be null.`);
      throw new CustomError(props);
    }

    return value;
  };
}

export class CommandBasics extends CommandHandlers {
  constructor(name: string, protected permissions: bigint[]) {
    super(name);
  }

  /**
   * This `run` method will never be overwritten and will always check if the `interaction` is a command,
   * if a user has the correct permissions, log that the command has been used and finally execute the implemented `execute` method
   * @param interaction Raw interaction, can be command, button, selection etc.
   */
  public run = async (interaction: ChatInputCommandInteraction) => {
    // Check all user perms.
    if (!this.canUserRunInteraction(interaction)) return;

    try {
      await this.execute(interaction);
    } catch (e) {
      let errorMessage = `Hey! I encountered an error, please wait a second and try again.`;

      if (!(e instanceof CustomError)) {
        this.log.critical(`Received non custom error.\n${e}`);
      } else errorMessage = e.message;

      if (interaction.replied || interaction.deferred) {
        return interaction.editReply(errorMessage);
      } else {
        return interaction.reply({
          ephemeral: true,
          content: errorMessage,
        });
      }
    }
  };

  public canUserRunInteraction = (
    interaction:
      | ChatInputCommandInteraction
      | ButtonInteraction
      | SelectMenuInteraction
  ): boolean => {
    // Check all user perms.
    if (!this.canUserRunCommand(interaction)) {
      handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `You don't have the correct permissions to run this. To run this you need \`${this.permissions.map(
          (p) => PermissionMappings.get(p)
        )}\`.`,
      });
      return false;
    }

    return true;
  };

  /**
   * Check if a user has the required permissions to run the command.
   * @param interaction User interaction with memberPermissions
   * @returns True if user can run this command, false otherwise.
   */
  private canUserRunCommand = (
    interaction:
      | ChatInputCommandInteraction
      | ButtonInteraction
      | SelectMenuInteraction
      | AutocompleteInteraction
  ) => {
    return this.permissions.length
      ? interaction.memberPermissions?.has(this.permissions, true)
      : true;
  };
}
