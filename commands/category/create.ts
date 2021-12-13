import { CommandInteraction, Permissions } from 'discord.js';
import {
  CREATE_GUILD_CATEGORY,
  GET_CATEGORY_BY_NAME,
} from '../../src/database/database';
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
    const [categoryName, categoryDesc] = this.extractStringVariables(
      interaction,
      'category-name',
      'category-desc'
    );

    if (await GET_CATEGORY_BY_NAME(interaction.guildId, categoryName)) {
      return await interaction.reply({
        content: `Hey! It turns out you already have a category with that name made. Try checking it out.`,
      });
    }

    if (!categoryName) {
      return await interaction.reply({
        ephemeral: true,
        content: `Hey! It appears I am struggling to find the name you sent me. Please try again.`,
      });
    }

    CREATE_GUILD_CATEGORY(interaction.guildId, categoryName, categoryDesc).then(
      () => {
        interaction.reply({
          content: `Hey! I successfully created the category for you!`,
        });
      }
    );
  };
}
