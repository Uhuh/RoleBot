import { PermissionsBitField } from 'discord.js';
import { SlashCommand } from '../../command';
import { CategorySubCommand } from './category';

export class ConfigBaseCommand extends SlashCommand {
  constructor() {
    super('config', 'Change how RoleBot handles react roles.', [
      PermissionsBitField.Flags.ManageGuild,
    ]);

    this.addSubCommands([new CategorySubCommand(this.name)]);
  }
}
