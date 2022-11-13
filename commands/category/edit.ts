import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from 'discord.js';
import { Category as ICategory } from '../../src/database/entities/category.entity';

import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import { getDisplayCommandValues, handleInteractionReply, parseDisplayString } from '../../utilities/utils';
import {
  EDIT_CATEGORY_BY_ID,
  GET_CATEGORY_BY_ID,
} from '../../src/database/queries/category.query';
import { handleAutocompleteCategory } from '../../utilities/utilAutocomplete';

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
    this.addBoolOption(
      'remove-required-role',
      'Remove all required roles for the category.'
    );
    this.addRoleOption(
      'new-required-role',
      'Change what the required roles are for the category.'
    );
    this.addStringOption('display-order', 'Change how the category displays the react roles.', false, getDisplayCommandValues());
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

    const [categoryId, newName, newDesc] = this.extractStringVariables(
      interaction,
      'category',
      'new-name',
      'new-description'
    );

    const mutuallyExclusive =
      interaction.options.getBoolean('mutually-exclusive');

    const removeRequiredRole = interaction.options.getBoolean(
      'remove-required-role'
    );

    const newRequiredRoleId =
      interaction.options.getRole('new-required-role')?.id ?? undefined;

    const displayString = interaction.options.getString('display-order');

    const displayOrder = parseDisplayString(displayString);

    if (
      !newName &&
      !newDesc &&
      !displayString &&
      !newRequiredRoleId &&
      removeRequiredRole === null &&
      mutuallyExclusive === null
    ) {
      this.log.info(
        `User didn't change anything about the category`,
        interaction.guildId
      );

      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! You need to pass at _least_ one updated field about the category.`,
      });
    }

    const category = await GET_CATEGORY_BY_ID(Number(categoryId));

    if (!category) {
      this.log.info(
        `Category not found with id[${categoryId}]`,
        interaction.guildId
      );

      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! I couldn't find the category. Please wait a second and try again.`,
      });
    }

    const requiredRoleId = newRequiredRoleId ?? category.requiredRoleId;

    const updatedCategory: Partial<ICategory> = {
      name: newName ?? category.name,
      description: newDesc ?? category.description,
      mutuallyExclusive: mutuallyExclusive ?? category.mutuallyExclusive,
      requiredRoleId: removeRequiredRole ? null : requiredRoleId,
      displayOrder
    };

    EDIT_CATEGORY_BY_ID(category.id, updatedCategory)
      .then(() => {
        this.log.info(
          `Updated category[${category.id}] successfully.`,
          interaction.guildId
        );

        handleInteractionReply(this.log, interaction, {
          ephemeral: true,
          content: `Hey! I successfully updated the category \`${category.name}\` for you.`,
        });
      })
      .catch((e) =>
        this.log.critical(
          `Failed to edit category[${category.id}]\n${e}`,
          interaction.guildId
        )
      );
  };
}
