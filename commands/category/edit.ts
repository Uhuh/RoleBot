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

const enum CommandOptionNames {
  Category = 'category',
  Name = 'new-name',
  Description = 'new-description',
  MutuallyExclusive = 'mutually-exclusive',
  RemoveRoleType = 'remove-role-type',
  RequiredRole = 'new-required-role',
  ExcludedRole = 'new-excluded-role',
  DisplayOrder = 'display-order',
}

export class EditSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(baseCommand, 'edit', 'Edit a category.', [
      {
        name: CommandOptionNames.Category,
        description: 'The category to edit',
        type: ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true,
      },
      {
        name: CommandOptionNames.Name,
        description: 'Change the name of the category.',
        type: ApplicationCommandOptionType.String,
      },
      {
        name: CommandOptionNames.Description,
        description: 'Description of the category, use [remove] to remove it.',
        type: ApplicationCommandOptionType.String,
      },
      {
        name: CommandOptionNames.MutuallyExclusive,
        description:
          'Change if roles in this category should be mutually exclusive.',
        type: ApplicationCommandOptionType.Boolean,
      },
      {
        name: CommandOptionNames.RemoveRoleType,
        description: 'Select to remove either required-role or excluded-role',
        type: ApplicationCommandOptionType.String,
        choices: [
          { name: 'Required role', value: 'required-role' },
          { name: 'Excluded role', value: 'excluded-role' },
        ],
      },
      {
        name: CommandOptionNames.RequiredRole,
        description: 'Change the required-role.',
        type: ApplicationCommandOptionType.Role,
      },
      {
        name: CommandOptionNames.ExcludedRole,
        description: 'Change the excluded-role.',
        type: ApplicationCommandOptionType.Role,
      },
      {
        name: CommandOptionNames.DisplayOrder,
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

    const categoryId = this.expect(interaction.options.getString(CommandOptionNames.Category), {
      message: 'Category appears to be invalid!',
      prop: CommandOptionNames.Category,
    });

    /**
     * All the options from the slash command.
     */
    let newDesc = interaction.options.getString(CommandOptionNames.Description);
    const newName = interaction.options.getString(CommandOptionNames.Name);
    const mutuallyExclusive =
      interaction.options.getBoolean(CommandOptionNames.MutuallyExclusive);
    const removeRoleType = interaction.options.getString(CommandOptionNames.RemoveRoleType);
    const newRequiredRoleId =
      interaction.options.getRole(CommandOptionNames.RequiredRole)?.id ?? undefined;
    const newExcludedRoleId =
      interaction.options.getRole(CommandOptionNames.ExcludedRole)?.id ?? undefined;
    const displayString = interaction.options.getString(CommandOptionNames.DisplayOrder);

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
