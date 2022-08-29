import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import RoleBot from '../../src/bot';

import { handleInteractionReply } from '../../utilities/utils';
import {
  DELETE_CATEGORY_BY_ID,
  GET_CATEGORY_BY_NAME,
} from '../../src/database/queries/category.query';

export class RemoveCategoryCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'category-remove',
      'Delete a category. Deleting a category frees all roles it contains.',
      Category.category,
      [PermissionsBitField.Flags.ManageRoles]
    );

    this.addStringOption(
      'category-name',
      `Name of the category you want to delete.`,
      true
    );
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const [categoryName] = this.extractStringVariables(
      interaction,
      'category-name'
    );

    if (!categoryName) {
      this.log.debug(
        `Required option was empty for categoryName[${categoryName}]`,
        interaction.guildId
      );
      return handleInteractionReply(
        this.log,
        interaction,
        `Hey! I don't think you passed in a name. Could you please try again?`
      );
    }

    const category = await GET_CATEGORY_BY_NAME(
      interaction.guildId,
      categoryName
    );

    if (!category) {
      this.log.info(
        `Category[${categoryName}] does not exist on guild. Most likely name typo.`,
        interaction.guildId
      );

      return handleInteractionReply(
        this.log,
        interaction,
        `Hey! I could **not** find a category by the name of \`${categoryName}\`. This command is case sensitive to ensure you delete exactly what you want. Check the name and try again.`
      );
    }

    DELETE_CATEGORY_BY_ID(category.id)
      .then(() => {
        this.log.info(
          `Successfully deleted category[${categoryName}] for guild`,
          interaction.guildId
        );

        handleInteractionReply(
          this.log,
          interaction,
          `Hey! I successfully deleted the category \`${categoryName}\` for you and freed all the roles on it.`
        );
      })
      .catch((e) => {
        this.log.error(
          `Issues deleting category[${categoryName}]\n${e}`,
          interaction.guildId
        );

        handleInteractionReply(
          this.log,
          interaction,
          `Hey! I had an issue deleting the category. Please wait a second and try again.`
        );
      });
  };
}
