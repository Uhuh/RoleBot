import { CommandInteraction, Permissions } from 'discord.js';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import RoleBot from '../../src/bot';
import {
  DELETE_CATEGORY_BY_ID,
  GET_CATEGORY_BY_NAME,
} from '../../src/database/database';

export class RemoveCategoryCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'category-remove',
      'Delete a category. Deleting a category frees all roles it contains.',
      Category.category,
      [Permissions.FLAGS.MANAGE_ROLES]
    );

    this.addStringOption(
      'category-name',
      `Name of the category you want to delete.`,
      true
    );
  }

  execute = async (interaction: CommandInteraction) => {
    const [categoryName] = this.extractStringVariables(
      interaction,
      'category-name'
    );

    if (!categoryName) {
      this.log.debug(
        `Required option was empty for categoryName[${categoryName}] on guild[${interaction.guildId}]`
      );
      return interaction.reply(
        `Hey! I don't think you passed in a name. Could you please try again?`
      );
    }

    const category = await GET_CATEGORY_BY_NAME(
      interaction.guildId,
      categoryName
    );

    if (!category) {
      this.log.debug(
        `Category[${categoryName}] does not exist on guild[${interaction.guildId}]. Most likely name typo.`
      );
      return interaction.reply(
        `Hey! I could **not** find a category by the name of \`${categoryName}\`. This command is case sensitive to ensure you delete exactly what you want. Check the name and try again.`
      );
    }

    DELETE_CATEGORY_BY_ID(category.id)
      .then(() => {
        this.log.debug(
          `Successfully deleted category[${categoryName}] for guild[${interaction.guildId}]`
        );

        interaction.reply(
          `Hey! I successfully deleted the category for you and freed all the roles on it.`
        );
      })
      .catch((e) => {
        this.log.error(
          `Issues deleting category[${categoryName}] for guild[${interaction.guildId}]`
        );
        this.log.error(e);

        interaction.reply(
          `Hey! I had an issue deleting the category. Please wait a second and try again.`
        );
      });
  };
}
