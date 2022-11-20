import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from 'discord.js';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import {
  DELETE_CATEGORY_BY_ID,
  GET_CATEGORY_BY_ID,
} from '../../src/database/queries/category.query';
import { handleAutocompleteCategory } from '../../utilities/utilAutocomplete';
import * as i18n from 'i18n';

export class RemoveCategoryCommand extends SlashCommand {
  constructor() {
    super(
      'category-remove',
      'Delete a category. Deleting a category frees all roles it contains.',
      Category.category,
      [PermissionsBitField.Flags.ManageRoles]
    );

    this.addStringOption(
      'category-name',
      `The category you want to delete!`,
      true,
      [],
      true
    );
  }

  handleAutoComplete = async (interaction: AutocompleteInteraction) => {
    try {
      await handleAutocompleteCategory(interaction);
    } catch (e) {
      this.log.error(`Failed to get categories for autocomplete.\n${e}`);

      await interaction.respond([
        { name: `SHOULD NOT SEE THIS! :)`, value: 'oopsies!' },
      ]);
    }
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const categoryId = interaction.options.getString('category-name');
    const category = await GET_CATEGORY_BY_ID(Number(categoryId));

    if (!category) {
      this.log.error(
        `Category[${categoryId}] does not exist on guild.`,
        interaction.guildId
      );

      return interaction.reply({
        ephemeral: true,
        content: i18n.__('CATEGORY.REMOVE.CATEGORY.INVALID'),
      });
    }

    DELETE_CATEGORY_BY_ID(category.id)
      .then(() => {
        this.log.info(
          `Successfully deleted category[${categoryId}]`,
          interaction.guildId
        );

        return interaction.reply({
          ephemeral: true,
          content: i18n.__('CATEGORY.REMOVE.SUCCESS', { name: category.name }),
        });
      })
      .catch((e) => {
        this.log.error(
          `Issues deleting category[${categoryId}]\n${e}`,
          interaction.guildId
        );

        return interaction.reply({
          ephemeral: true,
          content: i18n.__('CATEGORY.REMOVE.FAILED'),
        });
      });
  };
}
