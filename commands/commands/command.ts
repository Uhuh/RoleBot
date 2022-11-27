import {
  APIApplicationCommandOptionChoice,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ButtonInteraction,
  ChatInputCommandInteraction,
  SelectMenuInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { CustomError } from '../../src/error/custom.error';
import { LogService } from '../../src/services/logService';
import { handleInteractionReply } from '../../utilities/utils';
import { PermissionMappings } from '../slashCommand';

export type SlashCommandOptions = 'string' | 'bool' | 'channel' | 'role';

export interface ICommandOption {
  name: string;
  description: string;
  type: ApplicationCommandOptionType;
  choices?: APIApplicationCommandOptionChoice<string>[];
  required?: boolean;
  autocomplete?: boolean;
}

export class CommandHandlers {
  public log = new LogService(this.name);

  constructor(public name: string) {}
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
  public handleAutoComplete = async (interaction: AutocompleteInteraction) => {
    console.log(interaction);
    return interaction.respond([
      { name: 'Hey! You forgot to implement autocomplete!', value: 'oops' },
    ]);
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

const buildOption = (
  builder: SlashCommandSubcommandBuilder,
  option: ICommandOption
) => {
  switch (option.type) {
    case ApplicationCommandOptionType.Boolean:
      break;
    case ApplicationCommandOptionType.Channel:
      break;
    case ApplicationCommandOptionType.Role:
      break;
    case ApplicationCommandOptionType.String:
      builder.addStringOption((o) =>
        o
          .setName(option.name)
          .setDescription(option.description)
          .setRequired(option.required ?? false)
          .setChoices(...(option.choices ?? []))
          .setAutocomplete(option.autocomplete ?? false)
      );
      break;
  }
};

export class SlashSubCommand extends CommandHandlers {
  constructor(
    public name: string,
    public description: string,
    public options: ICommandOption[]
  ) {
    super(name);
  }

  createSubCommand(command: SlashCommandBuilder) {
    command.addSubcommand((builder) => {
      builder.setName(this.name).setDescription(this.description);
      for (const option of this.options) {
        buildOption(builder, option);
      }
      return builder;
    });
  }
}

export class SlashCommand extends CommandBasics {
  private command: SlashCommandBuilder;
  public subCommands = new Map<string, SlashSubCommand>();

  constructor(
    public name: string,
    public description: string,
    permissions: bigint[]
  ) {
    super(name, permissions);

    this.command = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDefaultMemberPermissions(
        this.permissions.length
          ? this.permissions.reduce((a, b) => a | b)
          : undefined
      );
  }

  addSubCommands(subCommands: SlashSubCommand[]) {
    for (const subCommand of subCommands) {
      subCommand.createSubCommand(this.command);
      this.subCommands.set(subCommand.name, subCommand);
    }
  }

  toJSON() {
    return this.command.toJSON();
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    try {
      const subCommandName = interaction.options.getSubcommand();
      const subCommand = this.subCommands.get(subCommandName);

      if (!subCommand) throw `Missing sub command ${subCommandName}`;

      await subCommand.execute(interaction);
    } catch (e) {
      this.log.error(`Failed while handling subCommand execute\n${e}`);
    }
  };

  handleAutoComplete = async (interaction: AutocompleteInteraction) => {
    try {
      const subCommandName = interaction.options.getSubcommand();
      const subCommand = this.subCommands.get(subCommandName);

      if (!subCommand) throw `Missing sub command ${subCommandName}`;

      await subCommand.handleAutoComplete(interaction);
    } catch (e) {
      this.log.error(`Failed while handling subCommand autocomplete\n${e}`);
    }
  };
}
