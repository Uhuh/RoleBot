import { PermissionsBitField } from 'discord.js';
import { SlashCommand } from '../command';
import { ChannelSubCommand } from './channel';
import { CleanSubCommand } from './clean';
import { CreateSubcommand } from './create';
import { EditSubCommand } from './edit';
import { ListSubCommand } from './list';
import { MessageSubCommand } from './message';
import { MoveSubCommand } from './move';
import { NukeSubCommand } from './nuke';
import { RemoveSubCommand } from './remove';

export class ReactBaseCommand extends SlashCommand {
  constructor() {
    super('react', 'Add, create, edit and more with your react roles.', [
      PermissionsBitField.Flags.ManageRoles,
    ]);

    this.addSubCommands([
      new ChannelSubCommand(this.name),
      new CleanSubCommand(this.name),
      new CreateSubcommand(this.name),
      new EditSubCommand(this.name),
      new ListSubCommand(this.name),
      new MessageSubCommand(this.name),
      new MoveSubCommand(this.name),
      new NukeSubCommand(this.name),
      new RemoveSubCommand(this.name),
    ]);
  }
}
