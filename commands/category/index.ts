import { PermissionsBitField } from 'discord.js';
import { SlashCommand } from '../command';
import { AddSubCommand } from './add';
import { CreateSubCommand } from './create';
import { EditSubCommand } from './edit';
import { ListSubCommand } from './list';
import { RemoveSubCommand } from './remove';
import { UpdateSubCommand } from './update';

export class CategoryBaseCommand extends SlashCommand {
  constructor() {
    super(
      'category',
      'add, create, remove, edit and more for your categories',
      [PermissionsBitField.Flags.ManageRoles],
    );

    this.addSubCommands([
      new AddSubCommand(this.name),
      new CreateSubCommand(this.name),
      new EditSubCommand(this.name),
      new ListSubCommand(this.name),
      new RemoveSubCommand(this.name),
      new UpdateSubCommand(this.name),
    ]);
  }
}
