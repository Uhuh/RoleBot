import { CommandInteraction, Permissions } from 'discord.js';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class ListCategoryCommand extends SlashCommand {
  constructor() {
    super(
      'category-list',
      'List all your categories and the roles within them.',
      Category.category,
      [Permissions.FLAGS.MANAGE_ROLES]
    );
  }

  execute = (interaction: CommandInteraction) => {
    interaction.reply({
      ephemeral: true,
      content: 'Category-list responds.',
    });
  };
}
