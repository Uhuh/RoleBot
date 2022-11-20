import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from 'discord.js';
import {
  Category as ICategory,
  DisplayType,
} from '../../src/database/entities/category.entity';

import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import {
  getDisplayCommandValues,
  parseDisplayString,
} from '../../utilities/utils';
import {
  EDIT_CATEGORY_BY_ID,
  GET_CATEGORY_BY_ID,
} from '../../src/database/queries/category.query';
import { handleAutocompleteCategory } from '../../utilities/utilAutocomplete';
import * as i18n from 'i18n';

export class EditCategoryCommand extends SlashCommand {
  constructor() {
    super(
      'category-edit',
      `Edit any category's information.`,
      Category.category,
      [PermissionsBitField.Flags.ManageRoles]
    );

    this.addStringOption(
      'category',
      'The category you want to edit.',
      true,
      [],
      true
    );
    this.addStringOption(
      'new-name',
      'Change the name of the category. This is the title of the embed.'
    );
    this.addStringOption(
      'new-description',
      'Change the description. This is shown above your react roles in the embed.'
    );
    this.addBoolOption(
      'mutually-exclusive',
      'Change if roles in this category should be mutually exclusive.'
    );
    this.addStringOption(
      'remove-role-type',
      'Select to remove either required-role or excluded-role.',
      false,
      [
        { name: 'Required role', value: 'required-role' },
        { name: 'Excluded role', value: 'excluded-role' },
      ]
    );
    this.addRoleOption(
      'new-required-role',
      'Change what the required roles are for the category.'
    );
    this.addRoleOption(
      'new-excluded-role',
      'Change what the required roles are for the category.'
    );
    this.addStringOption(
      'display-order',
      'Change how the category displays the react roles.',
      false,
      getDisplayCommandValues()
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

    const categoryId = this.expect(interaction.options.getString('category'), {
      message: i18n.__('CATEGORY.EDIT.CATEGORY.INVALID_ID'),
      prop: `category`,
    });
    const newName = interaction.options.getString('new-name');
    const newDesc = interaction.options.getString('new-description');

    const mutuallyExclusive =
      interaction.options.getBoolean('mutually-exclusive');

    const removeRoleType = interaction.options.getString('remove-role-type');

    const newRequiredRoleId =
      interaction.options.getRole('new-required-role')?.id ?? undefined;
    const newExcludedRoleId =
      interaction.options.getRole('new-excluded-role')?.id ?? undefined;

    const displayString = interaction.options.getString('display-order');

    const displayOrder = parseDisplayString(
      displayString as keyof typeof DisplayType
    );

    if (
      !newName &&
      !newDesc &&
      !displayString &&
      !newRequiredRoleId &&
      !newExcludedRoleId &&
      removeRoleType === null &&
      mutuallyExclusive === null
    ) {
      this.log.info(
        `User didn't change anything about the category`,
        interaction.guildId
      );

      return interaction.reply({
        ephemeral: true,
        content: i18n.__('CATEGORY.EDIT.INVALID'),
      });
    }

    const category = this.expect(await GET_CATEGORY_BY_ID(Number(categoryId)), {
      message: i18n.__('CATEGORY.EDIT.CATEGORY.INVALID'),
      prop: 'category',
    });

    const requiredRoleId = newRequiredRoleId ?? category.requiredRoleId;
    const excludedRoleId = newExcludedRoleId ?? category.excludedRoleId;

    const updatedCategory: Partial<ICategory> = {
      name: newName ?? category.name,
      description: newDesc ?? category.description,
      mutuallyExclusive: mutuallyExclusive ?? category.mutuallyExclusive,
      requiredRoleId:
        removeRoleType && removeRoleType === 'required-role'
          ? null
          : requiredRoleId,
      excludedRoleId:
        removeRoleType && removeRoleType === 'excluded-role'
          ? null
          : excludedRoleId,
      displayOrder,
    };

    EDIT_CATEGORY_BY_ID(category.id, updatedCategory)
      .then(() => {
        this.log.info(
          `Updated category[${category.id}] successfully.`,
          interaction.guildId
        );

        return interaction.reply({
          ephemeral: true,
          content: i18n.__('CATEGORY.EDIT.SUCCESS', { name: category.name }),
        });
      })
      .catch((e) => {
        this.log.critical(
          `Failed to edit category[${category.id}]\n${e}`,
          interaction.guildId
        );

        return interaction.reply({
          ephemeral: true,
          content: i18n.__('CATEGORY.EDIT.FAILED', { name: category.name }),
        });
      });
  };
}
