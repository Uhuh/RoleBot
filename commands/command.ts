import {
  APIApplicationCommandOptionChoice,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ButtonInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  PermissionsBitField,
  SlashCommandBuilder,
  SlashCommandSubcommandBuilder,
} from 'discord.js';
import { CommandBasics, CommandHandlers } from './command-basics';

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

export interface ICommandOption {
  name: string;
  description: string;
  type: ApplicationCommandOptionType;
  choices?: APIApplicationCommandOptionChoice<string>[];
  required?: boolean;
  autocomplete?: boolean;
}

const buildOption = (
  builder: SlashCommandSubcommandBuilder | SlashCommandBuilder,
  option: ICommandOption
) => {
  switch (option.type) {
    case ApplicationCommandOptionType.Boolean:
      builder.addBooleanOption((o) =>
        o
          .setName(option.name)
          .setDescription(option.description)
          .setRequired(option.required ?? false)
      );
      break;
    case ApplicationCommandOptionType.Channel:
      builder.addChannelOption((o) =>
        o
          .setName(option.name)
          .addChannelTypes(ChannelType.GuildText)
          .setDescription(option.description)
          .setRequired(option.required ?? false)
      );
      break;
    case ApplicationCommandOptionType.Role:
      builder.addRoleOption((o) =>
        o
          .setName(option.name)
          .setDescription(option.description)
          .setRequired(option.required ?? false)
      );
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
    public readonly baseName: string,
    public readonly name: string,
    public readonly description: string,
    public readonly options: ICommandOption[] = []
  ) {
    super(name, baseName);
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
  private readonly command: SlashCommandBuilder;
  public subCommands = new Map<string, SlashSubCommand>();

  constructor(
    public name: string,
    public description: string,
    permissions: bigint[] = [],
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

  addOption(options: ICommandOption[]) {
    for (const option of options) {
      buildOption(this.command, option);
    }
  }

  toJSON() {
    return this.command.toJSON();
  }

  getSubCommand(
    interaction: ChatInputCommandInteraction | AutocompleteInteraction
  ) {
    const subCommandName = interaction.options.getSubcommand();
    const subCommand = this.subCommands.get(subCommandName);

    if (!subCommand) throw `Missing sub command ${subCommandName}`;

    return subCommand;
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    try {
      const subCommand = this.getSubCommand(interaction);
      await subCommand.execute(interaction);
    } catch (e) {
      this.log.error(`Failed while handling subCommand execute\n${e}`);
    }
  };

  handleAutoComplete = async (interaction: AutocompleteInteraction) => {
    try {
      const subCommand = this.getSubCommand(interaction);
      await subCommand.handleAutoComplete(interaction);
    } catch (e) {
      this.log.error(`Failed while handling subCommand autocomplete\n${e}`);
    }
  };

  handleButton = async (
    interaction: ButtonInteraction,
    subCommandName: string,
    _args: string[]
  ) => {
    try {
      const subCommand = this.subCommands.get(subCommandName);

      if (!subCommand) throw `Missing sub command ${subCommandName}`;

      await subCommand.handleButton(interaction, subCommandName, _args);
    } catch (e) {
      this.log.error(`Failed while handling subCommand handleButton\n${e}`);
    }
  };
}
