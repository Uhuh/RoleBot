import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Interaction,
  SelectMenuInteraction,
  PermissionsBitField,
  AutocompleteInteraction,
} from 'discord.js';
import {
  Category,
  DataCommand,
  SlashCommandTypes,
} from '../utilities/types/commands';
import { SlashCommandBuilder } from '@discordjs/builders';
import { LogService } from '../src/services/logService';
import { SlashBase } from './slashBase';
import { handleInteractionReply } from '../utilities/utils';
import { CustomError } from '../src/error/custom.error';

export const PermissionMappings: Map<bigint, string> = new Map([
  [PermissionsBitField.Flags.ReadMessageHistory, 'READ_MESSAGE_HISTORY'],
  [PermissionsBitField.Flags.BanMembers, 'BAN_MEMBERS'],
  [PermissionsBitField.Flags.KickMembers, 'KICK_MEMBERS'],
  [PermissionsBitField.Flags.ManageGuild, 'MANAGE_GUILD'],
  [PermissionsBitField.Flags.ManageRoles, 'MANAGE_ROLES'],
  [PermissionsBitField.Flags.ManageMessages, 'MANAGE_MESSAGES'],
  [PermissionsBitField.Flags.AddReactions, 'ADD_REACTIONS'],
  [PermissionsBitField.Flags.SendMessages, 'SEND_MESSAGES'],
  [PermissionsBitField.Flags.AttachFiles, 'ATTACH_FILES'],
  [PermissionsBitField.Flags.EmbedLinks, 'EMBED_LINKS'],
]);

/**
 * @SlashCommand Helps create the JSON for the slash command and handle its execution.
 */
export abstract class SlashCommand extends SlashBase implements DataCommand {
  public name: string;
  public desc: string;
  public type: Category;
  private readonly permissions: bigint[];

  public log: LogService;

  constructor(
    _name: string,
    _desc: string,
    _type: Category,
    _permissions: bigint[] = [],
    _commandOverride: SlashCommandTypes | null = null
  ) {
    const command =
      _commandOverride ??
      new SlashCommandBuilder()
        .setName(_name)
        .setDescription(_desc)
        .setDefaultMemberPermissions(
          _permissions.length ? _permissions.reduce((a, b) => a | b) : undefined
        );

    super(command);
    this.name = _name;
    this.desc = _desc;
    this.type = _type;
    this.permissions = _permissions;
    this.log = new LogService(`command:${this.name}`);
  }

  /**
   * This `run` method will never be overwritten and will always check if the `interaction` is a command,
   * if a user has the correct permissions, log that the command has been used and finally execute the implemented `execute` method
   * @param interaction Raw interaction, can be command, button, selection etc.
   */
  public run = async (interaction: Interaction) => {
    // Ignore interactions that aren't commands.
    if (!interaction.isChatInputCommand()) {
      return this.log.debug(
        `Interaction was not a command. Command that got ran[${this.name}]`
      );
    }

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
        interaction.editReply(errorMessage);
      } else {
        interaction.reply({
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
      | AutocompleteInteraction
  ): boolean => {
    // Check all user perms.
    if (!this.canUserRunCommand(interaction)) {
      if (!interaction.isAutocomplete()) {
        handleInteractionReply(this.log, interaction, {
          ephemeral: true,
          content: `You don't have the correct permissions to run this. To run this you need \`${this.permissions.map(
            (p) => PermissionMappings.get(p)
          )}\`.`,
        });
      }
      return false;
    }

    return true;
  };

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
    _args: string[]
  ) => {
    handleInteractionReply(
      this.log,
      interaction,
      `Hey! Turns out you didn't implement this commands[${this.name}] dropdown handler yet. How about you do that?`
    );
  };

  /**
   * This method should be overwritten by the child class and implement the handling for any option passed.
   * @param interaction Button that was clicked
   * @param args IDs that are inside the buttons customId
   */
  public handleButton = (interaction: ButtonInteraction, _args: string[]) => {
    handleInteractionReply(
      this.log,
      interaction,
      `Hey! Turns out you didn't implement this commands[${this.name}] button handler yet. How about you do that?`
    );
  };

  /**
   * This method should respond with data related to the command.
   * @param interaction Interaction to give data to
   */
  public handleAutoComplete = (interaction: AutocompleteInteraction) => {
    interaction.respond([
      { name: 'Hey! You forgot to implement autocomplete!', value: 0 },
    ]);
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

  /**
   * TypeScript doesn't know what type a value is but I know the types for some commands options as they are setup in the constructor.
   * Instead of adding these checks for every command use this function to parse out all the properties.
   * @param interaction Command ran.
   * @param attrs Array of properties. This is because we set options and give them custom IDs.
   * @returns All properties passed in.
   */
  extractStringVariables = (
    interaction: ChatInputCommandInteraction,
    ...attrs: string[]
  ): Array<string | undefined> => {
    return attrs.map((a) => interaction.options.getString(a) ?? undefined);
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
