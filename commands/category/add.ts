import { CommandInteraction, Permissions } from 'discord.js';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class AddCategoryCommand extends SlashCommand {
  constructor() {
    super(
      'category-add',
      'Add reaction roles to a specific category.',
      Category.category,
      [Permissions.FLAGS.MANAGE_ROLES]
    );
  }

  execute = (interaction: CommandInteraction) => {
    interaction.reply({
      ephemeral: true,
      content: 'Category-add responds.',
    });
  };
}
