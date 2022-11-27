import { PermissionsBitField } from 'discord.js';
import { SlashCommand } from '../command';
import { AddSubCommand } from './add';

export class CategoryBaseCommand extends SlashCommand {
  constructor() {
    super(
      'category',
      'add, create, remove, edit and more for your categories',
      [PermissionsBitField.Flags.ManageRoles]
    );

    this.addSubCommands([new AddSubCommand()]);
  }
}
