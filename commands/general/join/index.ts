import { PermissionsBitField } from 'discord.js';
import { SlashCommand } from '../../command';
import { AddSubCommand } from './add';
import { ListSubCommand } from './list';
import { RemoveSubCommand } from './remove';

export class AutoJoinBaseCommand extends SlashCommand {
  constructor() {
    super('auto-join', 'Setup auto join roles for the server.', [
      PermissionsBitField.Flags.ManageRoles,
    ]);

    this.addSubCommands([
      new AddSubCommand(this.name),
      new ListSubCommand(this.name),
      new RemoveSubCommand(this.name),
    ]);
  }
}
