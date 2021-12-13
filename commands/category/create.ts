import { CommandInteraction, Permissions } from 'discord.js';
import { CREATE_GUILD_CATEGORY } from '../../src/database/database';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class CreateCategoryCommand extends SlashCommand {
  constructor() {
    super(
      'category-create',
      'Create a new category to categorize your reaction roles in.',
      Category.category,
      [Permissions.FLAGS.MANAGE_ROLES]
    );

    this.addStringOption('category-name', 'The name of the category', true);
    this.addStringOption('category-desc', 'Give your category a description.');
  }

  execute = async (interaction: CommandInteraction) => {
    const categoryName = interaction.options.get('category-name')?.value;
    const categoryDesc = interaction.options.get('category-desc')?.value;

    if (!categoryName) {
      return await interaction.reply({
        ephemeral: true,
        content: `Hey! It appears I am struggling to find the name you sent me. Please try again.`,
      });
    }

    CREATE_GUILD_CATEGORY(
      interaction.guildId,
      categoryName as string,
      categoryDesc as string | undefined
    ).then(() => {
      interaction.reply({
        content: `Hey! I successfully created the category for you!`,
      });
    });
  };
}
