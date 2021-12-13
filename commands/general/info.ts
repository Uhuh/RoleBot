import { CommandInteraction } from 'discord.js';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class InfoCommand extends SlashCommand {
  constructor() {
    super('info', `RoleBot's invite, ping, etc.`, Category.general);
  }
  execute = (interaction: CommandInteraction) => {
    interaction.reply({
      ephemeral: true,
      content: 'Info responds.',
    });
  };
}
