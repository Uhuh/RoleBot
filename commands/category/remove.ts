import { CommandInteraction, Permissions } from 'discord.js';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class RemoveCategoryCommand extends SlashCommand {
  constructor() {
    super(
      'category-remove',
      'Delete a category. Deleting a category frees all roles it contains.',
      Category.category,
      [Permissions.FLAGS.MANAGE_ROLES]
    );
  }

  execute = (interaction: CommandInteraction) => {
    interaction.reply({
      ephemeral: true,
      content: 'Category-remove responds.',
    });
  };
}
