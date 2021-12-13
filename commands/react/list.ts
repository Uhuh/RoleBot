import { CommandInteraction, Permissions } from 'discord.js';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class ReactListCommand extends SlashCommand {
  constructor() {
    super(
      'react-list',
      'List all reaction roles that are currently active.',
      Category.react,
      [Permissions.FLAGS.MANAGE_ROLES]
    );
  }

  execute = (interaction: CommandInteraction) => {
    interaction.reply({
      ephemeral: true,
      content: 'Reaction role created.',
    });
  };
}
