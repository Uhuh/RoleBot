import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, Interaction } from 'discord.js';
import { LogService } from '../src/services/logService';
import { Category, DataCommand } from '../utilities/types/commands';
import { SlashBase } from './slashBase';

interface CommandData {
  time: Date;
  guildId: string;
  channelId: string;
  userId: string;
  command: string;
}

export abstract class SlashCommand extends SlashBase implements DataCommand {
  public name: string;
  public desc: string;
  public type: Category;
  private permissions: bigint[];
  private executions: CommandData[] = [];

  constructor(
    _name: string,
    _desc: string,
    _type: Category,
    _permissions: bigint[] = []
  ) {
    super(new SlashCommandBuilder().setName(_name).setDescription(_desc));
    LogService.setPrefix(`SlashCommandConstructor`);
    this.name = _name;
    this.desc = _desc;
    this.type = _type;
    this.permissions = _permissions;
  }

  public run = (interaction: Interaction) => {
    LogService.setPrefix(`command:${this.name}`);

    // Ignore interactions that aren't commands.
    if (!interaction.isCommand())
      return LogService.debug(
        `Interaction was not a command. Command that got ran[${this.name}]`
      );

    // Check all user perms.
    if (!this.canUserRunCommand(interaction)) {
      interaction.reply({
        ephemeral: true,
        content: `You don't have the correct permissions to run this.`,
      });
      return LogService.debug(
        `User doesn't have correct perms to run command.`
      );
    }

    this.executions.push({
      channelId: interaction.channelId,
      command: interaction.commandName,
      guildId: interaction.guildId,
      time: new Date(),
      userId: interaction.user.id,
    });

    this.execute(interaction);
  };

  public execute = (interaction: CommandInteraction) => {
    interaction.reply({
      content: `Hey! Turns out you didn't implemented this command[${this.name}] yet. How about you do that?`,
    });
  };

  private canUserRunCommand = (interaction: Interaction) => {
    return interaction.memberPermissions?.has(this.permissions, true);
  };

  /**
   * TypeScript doesn't know what type a value is but I know the types for some commands options as they are setup in the constructor.
   * Instead of adding these checks for every command use this function to parse out all the properties.
   * @param interaction Command ran.
   * @param args Array of properties. This is because we set options and give them custom IDs.
   * @returns All properties passed in.
   */
  extractStringVariables = (
    interaction: CommandInteraction,
    ...args: string[]
  ): string[] => {
    return args.map((a) => {
      const val = interaction.options.get(a)?.value;
      if (typeof val !== 'string') {
        LogService.error(
          `Failed to extract string variable from interaction | [${a} : ${val}]`
        );
        return '';
      }
      return val;
    });
  };
}
