import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
} from 'discord.js';
import {
  DisplayType,
  ICategory,
} from '../../src/database/entities/category.entity';
import {
  EDIT_CATEGORY_BY_ID,
  GET_CATEGORY_BY_ID,
} from '../../src/database/queries/category.query';
import { handleAutocompleteCategory } from '../../utilities/utilAutocomplete';
import {
  getDisplayCommandValues,
  parseDisplayString,
} from '../../utilities/utils';
import { SlashSubCommand } from '../command';

export class EditSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(baseCommand, 'edit', 'Edit a category.', [
      {
        name: 'category',
        description: 'The category to edit',
        type: ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true,
      },
      {
        name: 'new-name',
        description: 'Change the name of the category.',
        type: ApplicationCommandOptionType.String,
      },
      {
        name: 'new-description',
        description: 'Description of the category, use [remove] to remove it.',
        type: ApplicationCommandOptionType.String,
      },
      {
        name: 'mutually-exclusive',
        description:
          'Change if roles in this category should be mutually exclusive.',
        type: ApplicationCommandOptionType.Boolean,
      },
      {
        name: 'remove-role-type',
        description: 'Select to remove either required-role or excluded-role',
        type: ApplicationCommandOptionType.String,
        choices: [
          { name: 'Required role', value: 'required-role' },
          { name: 'Excluded role', value: 'excluded-role' },
        ],
      },
      {
        name: 'new-required-role',
        description: 'Change the required-role.',
        type: ApplicationCommandOptionType.Role,
      },
      {
        name: 'new-excluded-role',
        description: 'Change the excluded-role.',
        type: ApplicationCommandOptionType.Role,
      },
      {
        name: 'display-order',
        description: 'Change display order',
        type: ApplicationCommandOptionType.String,
        choices: getDisplayCommandValues(),
      },
    ]);
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

    await interaction.deferReply({
      ephemeral: true,
    });

    const categoryId = this.expect(interaction.options.getString('category'), {
      message: 'Category appears to be invalid!',
      prop: `category`,
    });

    /**
     * All the options from the slash command.
     */
    let newDesc = interaction.options.getString('new-description');
    const newName = interaction.options.getString('new-name');
    const mutuallyExclusive =
      interaction.options.getBoolean('mutually-exclusive');
    const removeRoleType = interaction.options.getString('remove-role-type');
    const newRequiredRoleId =
      interaction.options.getRole('new-required-role')?.id ?? undefined;
    const newExcludedRoleId =
      interaction.options.getRole('new-excluded-role')?.id ?? undefined;
    const displayString = interaction.options.getString('display-order');

    const displayOrder = parseDisplayString(
      displayString as keyof typeof DisplayType,
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
        interaction.guildId,
      );

      return interaction.editReply(
        `Hey! You need to pass at _least_ one updated field about the category.`,
      );
    }

    const category = await GET_CATEGORY_BY_ID(Number(categoryId));

    if (!category) {
      this.log.info(
        `Category not found with id[${categoryId}]`,
        interaction.guildId,
      );

      return interaction.editReply(
        `Hey! I couldn't find the category. Please wait a second and try again.`,
      );
    }

    const requiredRoleId = newRequiredRoleId ?? category.requiredRoleId;
    const excludedRoleId = newExcludedRoleId ?? category.excludedRoleId;

    // Check if the user wants to remove the description.
    newDesc = newDesc?.trim() === '[remove]' ? '' : newDesc;
    
    const updatedCategory: Partial<ICategory> = {
      name: newName ?? category.name,
      description: newDesc ?? category.description,
      mutuallyExclusive: mutuallyExclusive ?? category.mutuallyExclusive,
      requiredRoleId:
        removeRoleType === 'required-role'
          ? null
          : requiredRoleId,
      excludedRoleId:
        removeRoleType === 'excluded-role'
          ? null
          : excludedRoleId,
      displayOrder,
    };

    EDIT_CATEGORY_BY_ID(category.id, updatedCategory)
      .then(() => {
        this.log.info(
          `Updated category[${category.id}] successfully.`,
          interaction.guildId,
        );

        return interaction.editReply(
          `Hey! I successfully updated the category \`${category.name}\` for you.`,
        );
      })
      .catch((e) =>
        this.log.critical(
          `Failed to edit category[${category.id}]\n${e}`,
          interaction.guildId,
        ),
      );
  };
}
