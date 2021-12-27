import { CommandInteraction, Permissions } from 'discord.js';
import RoleBot from '../../src/bot';
import {
  CREATE_GUILD_CATEGORY,
  GET_CATEGORY_BY_NAME,
} from '../../src/database/database';
import { LogService } from '../../src/services/logService';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class CreateCategoryCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
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

    if (!categoryName) {
      return interaction.reply({
        ephemeral: true,
        content: `Hey! It says you submitted no category name! You need to submit that. Please try again.`,
      });
    }

    if (await GET_CATEGORY_BY_NAME(interaction.guildId, categoryName)) {
      return await interaction.reply(
        `Hey! It turns out you already have a category with that name made. Try checking it out.`
      );
    }

    CREATE_GUILD_CATEGORY(interaction.guildId, categoryName, categoryDesc)
      .then(() => {
        LogService.debug(
          `Successfully created category[${categoryName}] for guild[${interaction.guildId}]`
        );
        interaction.reply(`Hey! I successfully created the category for you!`);
      })
      .catch((e) => {
        LogService.error(
          `Issue creating category[${categoryName}] for guild[${interaction.guildId}]`
        );
        LogService.error(e);

        interaction.reply(
          `Hey! I had some trouble creating that category for you. Please wait a minute and try again.`
        );
      });
  };
}
