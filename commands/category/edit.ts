import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  MessageFlags,
} from 'discord.js';
import { DisplayType, ICategory } from '../../src/database/entities/category.entity';
import { EDIT_CATEGORY_BY_ID, GET_CATEGORY_BY_ID } from '../../src/database/queries/category.query';
import { handleAutocompleteCategory } from '../../utilities/utilAutocomplete';
import {
  getDisplayCommandChoices,
  getImageTypeCommandChoices,
  parseDisplayString,
  parseImageTypeString,
} from '../../utilities/utils';
import { SlashSubCommand } from '../command';

const enum CommandOptionNames {
  Category = 'category',
  Name = 'new-name',
  Description = 'new-description',
  DisplayRoles = 'display-roles',
  MutuallyExclusive = 'mutually-exclusive',
  RemoveRoleType = 'remove-role-type',
  RequiredRole = 'new-required-role',
  ExcludedRole = 'new-excluded-role',
  DisplayOrder = 'display-order',
  ImageType = 'image-type',
  ImageUrl = 'image-url',
  EmbedColor = 'embed-color',
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
        name: CommandOptionNames.DisplayRoles,
        description: 'If you want to display the roles in the embed or not.',
        type: ApplicationCommandOptionType.Boolean,
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
        choices: getDisplayCommandChoices(),
      },
      {
        name: CommandOptionNames.ImageType,
        description: 'How images will layout in your embed.',
        type: ApplicationCommandOptionType.String,
        choices: getImageTypeCommandChoices(),
      },
      {
        name: CommandOptionNames.ImageUrl,
        description: 'Use an image hosting site and link it here, use [remove] to remove the image.',
        type: ApplicationCommandOptionType.String,
      },
      {
        name: CommandOptionNames.EmbedColor,
        description: 'A hexcode without the #. Example `FFFFFF` for white, use [remove] to remove the color.',
        type: ApplicationCommandOptionType.String,
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
      flags: MessageFlags.Ephemeral,
    });

    /**
     * The options on data are the options for this current command
     * If the length is less than 1, we know no options were passed therefore there is nothing to edit.
     */
    const { options } = interaction.options.data[0];

    if (options && options.length <= 1) {
      this.log.info(
        `User didn't change anything about the category`,
        interaction.guildId,
      );

      return interaction.editReply(
        `Hey! You need to pass at _least_ one updated field about the category.`,
      );
    }

    // Now that we know there is something to edit, get the category!
    const categoryId = this.expect(interaction.options.getString(CommandOptionNames.Category), {
      message: 'Category appears to be invalid!',
      prop: CommandOptionNames.Category,
    });

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

    /**
     * All the options from the slash command.
     */
    let newDesc = interaction.options.getString(CommandOptionNames.Description);
    const newName = interaction.options.getString(CommandOptionNames.Name);
    const mutuallyExclusive =
      interaction.options.getBoolean(CommandOptionNames.MutuallyExclusive);
    const displayRoles =
      interaction.options.getBoolean(CommandOptionNames.DisplayRoles);
    const removeRoleType = interaction.options.getString(CommandOptionNames.RemoveRoleType);
    const newRequiredRoleId =
      interaction.options.getRole(CommandOptionNames.RequiredRole)?.id ?? undefined;
    const newExcludedRoleId =
      interaction.options.getRole(CommandOptionNames.ExcludedRole)?.id ?? undefined;
    const displayString = interaction.options.getString(CommandOptionNames.DisplayOrder);

    // Embed styling options
    const imageTypeString = interaction.options.getString(CommandOptionNames.ImageType);
    const imageUrl = interaction.options.getString(CommandOptionNames.ImageUrl);
    let embedColor = interaction.options.getString(CommandOptionNames.EmbedColor);

    const imageType = parseImageTypeString(imageTypeString);
    const displayOrder = parseDisplayString(
      displayString as keyof typeof DisplayType,
    );

    const requiredRoleId = newRequiredRoleId ?? category.requiredRoleId;
    const excludedRoleId = newExcludedRoleId ?? category.excludedRoleId;

    // Check for removals
    newDesc = newDesc?.trim() === '[remove]' ? '' : newDesc;
    const removeImageUrl = imageUrl?.trim() === '[remove]';
    const removeEmbedColor = embedColor?.trim() === '[remove]';

    const hexRegex = new RegExp(/[0-9A-F]{6}$/gi);
    const isCorrectHex = hexRegex.test(embedColor ?? '');

    // If the user input an incorrect hex value, just default to whatever
    if (!isCorrectHex && embedColor) {
      // This is a shade of purple I like :)
      embedColor = '945ad2';
    }

    const updatedCategory: Partial<ICategory> = {
      name: newName ?? category.name,
      description: newDesc ?? category.description,
      mutuallyExclusive: mutuallyExclusive ?? category.mutuallyExclusive,
      displayRoles: displayRoles ?? category.displayRoles,
      displayOrder: displayOrder ?? category.displayOrder,
      imageType: imageType ?? category.imageType,
      imageUrl: removeImageUrl ? null : imageUrl ?? category.imageUrl,
      embedColor: removeEmbedColor ? null : embedColor ?? category.embedColor,
      requiredRoleId:
        removeRoleType === 'required-role'
          ? null
          : requiredRoleId,
      excludedRoleId:
        removeRoleType === 'excluded-role'
          ? null
          : excludedRoleId,
    };

    EDIT_CATEGORY_BY_ID(category.id, updatedCategory)
      .then(() => {
        this.log.info(
          `Updated category[${category.id}] successfully.`,
          interaction.guildId,
        );

        const invalidHex = `\n\nAn invalid hex code was provided. Remember, hex codes look like this \`#ff0000\`. Use an online tool to make one.`;

        return interaction.editReply(
          `Hey! I successfully updated the category \`${category.name}\` for you.${(embedColor && !isCorrectHex) ? invalidHex : ''}`,
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
