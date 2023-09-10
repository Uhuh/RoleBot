import { SlashCommand } from '../command';
import { PermissionsBitField } from 'discord.js';
import { CreateSubCommand } from './create';
import { ListSubCommand } from './list';

export class LinkBaseCommand extends SlashCommand {
  constructor() {
    super(
      'link',
      'Link roles to a react role. These are additional roles granted / taken with the react role.',
      [PermissionsBitField.Flags.ManageRoles],
    );

    this.addSubCommands([
      new CreateSubCommand(this.name),
      new ListSubCommand(this.name),
    ]);
  }
}