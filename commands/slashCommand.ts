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
    // Ignore interactions that aren't commands.
    if (!interaction.isCommand())
      return LogService.debug(
        `Interaction was not a command. Command that got ran[${this.name}]`
      );
    // Check all user perms.
    if (!this.canUserRunCommand(interaction))
      return LogService.debug(`User cannot run command[${this.name}]`);

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
}
