import {
  ButtonInteraction,
  CommandInteraction,
  Interaction,
  Permissions,
  SelectMenuInteraction,
} from 'discord.js-light';
import { Category, DataCommand } from '../utilities/types/commands';
import { SlashCommandBuilder } from '@discordjs/builders';
import { LogService } from '../src/services/logService';
import { SlashBase } from './slashBase';
import RoleBot from '../src/bot';

export const PermissionMappings: Map<bigint, string> = new Map([
  [Permissions.FLAGS.READ_MESSAGE_HISTORY, 'READ_MESSAGE_HISTORY'],
  [Permissions.FLAGS.BAN_MEMBERS, 'BAN_MEMBERS'],
  [Permissions.FLAGS.KICK_MEMBERS, 'KICK_MEMBERS'],
  [Permissions.FLAGS.MANAGE_GUILD, 'MANAGE_GUILD'],
  [Permissions.FLAGS.MANAGE_ROLES, 'MANAGE_ROLES'],
  [Permissions.FLAGS.MANAGE_MESSAGES, 'MANAGE_MESSAGES'],
  [Permissions.FLAGS.ADD_REACTIONS, 'ADD_REACTIONS'],
  [Permissions.FLAGS.SEND_MESSAGES, 'SEND_MESSAGES'],
  [Permissions.FLAGS.ATTACH_FILES, 'ATTACH_FILES'],
  [Permissions.FLAGS.EMBED_LINKS, 'EMBED_LINKS'],
]);

// Basic command metadata for now. Want to learn how users are utilizing the bot.
interface CommandData {
  time: Date;
  guildId: string;
  channelId: string;
  userId: string;
  command: string;
}

/**
 * @SlashCommand Helps create the JSON for the slash command and handle its execution.
 */
export abstract class SlashCommand extends SlashBase implements DataCommand {
  public name: string;
  public desc: string;
  public type: Category;
  private permissions: bigint[];
  private executions: CommandData[] = [];

  public log: LogService;

  private static totalCommandsRun = 0;

  /**
   * This is for commands that may need information from the client
   * Such as needed guild data.
   */
  public client: RoleBot;

  constructor(
    _client: RoleBot,
    _name: string,
    _desc: string,
    _type: Category,
    _permissions: bigint[] = []
  ) {
    super(new SlashCommandBuilder().setName(_name).setDescription(_desc));
    this.client = _client;
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
  public run = (interaction: Interaction): void => {
    // Ignore interactions that aren't commands.
    if (!interaction.isCommand()) {
      return this.log.debug(
        `Interaction was not a command. Command that got ran[${this.name}]`
      );
    }

    // Check all user perms.
    if (!this.canUserRunInteraction(interaction)) return;

    this.executions.push({
      channelId: interaction.channelId,
      command: interaction.commandName,
      guildId: interaction.guildId || 'DM',
      time: new Date(),
      userId: interaction.user.id,
    });

    try {
      this.execute(interaction);
    } catch (e) {
      this.log.error(
        `Guild[${interaction.guildId}] encountered issue when running command[${this.name}]`
      );
      this.log.error(`${e}`);

      interaction.channel?.send(
        `Hey! Unfortunately I ran into an issue while running that command. Please try again.`
      );
    }
  };

  public canUserRunInteraction = (
    interaction: CommandInteraction | SelectMenuInteraction | ButtonInteraction
  ): boolean => {
    // Check all user perms.
    if (!this.canUserRunCommand(interaction)) {
      interaction
        .reply({
          ephemeral: true,
          content: `You don't have the correct permissions to run this. To run this you need \`${this.permissions.map(
            (p) => PermissionMappings.get(p)
          )}\`.`,
        })
        .catch((e) => this.log.error(`Interaction failed.\n${e}`));
      return false;
    }

    return true;
  };

  /**
   * This method should be overwritten by the child class and implement the commands functionality.
   * @param interaction Command that was ran and handed to this command from the handleInteraction function.
   */
  public execute = (interaction: CommandInteraction) => {
    interaction
      .reply(
        `Hey! Turns out you didn't implement this command[${this.name}] yet. How about you do that?`
      )
      .catch((e) => this.log.error(`Interaction failed.\n${e}`));
  };

  /**
   * This method should be overwritten by the child class and implement the handling for any option passed.
   *
   * All options should be keyed with the commands name followed by any IDs it needs separated by a `_`
   * `_` because the slash commands have to use `-`
   * @param interaction SelectMenu option that was clicked.
   * @param args Essentially all the IDs that are separated with `-`
   */
  public handleSelect = (
    interaction: SelectMenuInteraction,
    args: string[]
  ) => {
    interaction
      .reply(
        `Hey! Turns out you didn't implement this commands[${this.name}] dropdown handler yet. How about you do that?`
      )
      .catch((e) => this.log.error(`Interaction failed.\n${e}`));
  };

  /**
   * This method should be overwritten by the child class and implement the handling for any option passed.
   * @param interaction Button that was clicked
   * @param args IDs that are inside the buttons customId
   */
  public handleButton = (interaction: ButtonInteraction, args: string[]) => {
    interaction
      .reply(
        `Hey! Turns out you didn't implement this commands[${this.name}] button handler yet. How about you do that?`
      )
      .catch((e) => this.log.error(`Interaction failed.\n${e}`));
  };

  /**
   * Check if a user has the required permissions to run the command.
   * @param interaction User interaction with memberPermissions
   * @returns True if user can run this command, false otherwise.
   */
  private canUserRunCommand = (interaction: Interaction) => {
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
    interaction: CommandInteraction,
    ...attrs: string[]
  ): Array<string | undefined> => {
    return attrs.map((a) => {
      const val = interaction.options.get(a)?.value;
      if (typeof val !== 'string' && val !== undefined) {
        throw Error(
          `Failed to extract string variable from interaction | [${a} : ${val}]`
        );
      }
      return val;
    });
  };
}
