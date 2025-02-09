import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import { DisplayType } from '../../src/database/entities/category.entity';
import { CREATE_GUILD_CATEGORY, GET_CATEGORY_BY_NAME } from '../../src/database/queries/category.query';
import {
  getDisplayCommandChoices,
  getImageTypeCommandChoices,
  parseDisplayString,
  parseImageTypeString,
} from '../../utilities/utils';
import { SlashSubCommand } from '../command';

const enum CommandOptionNames {
  Name = 'name',
  Description = 'description',
  MutuallyExclusive = 'mutually-exclusive',
  DisplayRoles = 'display-roles',
  RequiredRole = 'required-role',
  ExcludedRole = 'excluded-role',
  DisplayOrder = 'display-order',
  ImageType = 'image-type',
  ImageUrl = 'image-url',
  EmbedColor = 'embed-color',
}

export class CreateSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(
      baseCommand,
      'create',
      'Create a new category to categorize your reaction roles in.',
      [
        {
          name: CommandOptionNames.Name,
          description: 'The name of the category.',
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: CommandOptionNames.Description,
          description: 'The description of the category.',
          type: ApplicationCommandOptionType.String,
        },
        {
          name: CommandOptionNames.MutuallyExclusive,
          description: 'Make roles from this category mutually exclusive.',
          type: ApplicationCommandOptionType.Boolean,
        },
        {
          name: CommandOptionNames.DisplayRoles,
          description: 'If you want to display the roles in the embed or not.',
          type: ApplicationCommandOptionType.Boolean,
        },
        {
          name: CommandOptionNames.RequiredRole,
          description:
            'Require users to have a certain role to obtain roles from this category.',
          type: ApplicationCommandOptionType.Role,
        },
        {
          name: CommandOptionNames.ExcludedRole,
          description:
            'Users with this role cannot obtain roles from this category.',
          type: ApplicationCommandOptionType.Role,
        },
        {
          name: CommandOptionNames.DisplayOrder,
          description: 'Change how the category displays the react roles.',
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
          description: 'Use an image hosting site and link it here, imgur for example.',
          type: ApplicationCommandOptionType.String,
        },
        {
          name: CommandOptionNames.EmbedColor,
          description: 'The hexcode you want the embed sidebar to be. Don\'t include the #.',
          type: ApplicationCommandOptionType.String,
        },
      ],
    );
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    // Essentials
    const name = this.expect(interaction.options.getString(CommandOptionNames.Name), {
      message: 'Hey! The category name is required when creating a category.',
      prop: CommandOptionNames.Name,
    });
    const description = interaction.options.getString(CommandOptionNames.Description);

    // "Permissions"
    const mutuallyExclusive =
      interaction.options.getBoolean(CommandOptionNames.MutuallyExclusive) ?? false;
    const requiredRoleId =
      interaction.options.getRole(CommandOptionNames.RequiredRole)?.id ?? null;
    const excludedRoleId =
      interaction.options.getRole(CommandOptionNames.ExcludedRole)?.id ?? null;
    const displayString = interaction.options.getString(CommandOptionNames.DisplayOrder);

    // Embed styling options
    const displayRoles =
      interaction.options.getBoolean(CommandOptionNames.DisplayRoles) ?? true;
    const imageTypeString = interaction.options.getString(CommandOptionNames.ImageType);
    const imageUrl = interaction.options.getString(CommandOptionNames.ImageUrl);
    let embedColor = interaction.options.getString(CommandOptionNames.EmbedColor);

    const imageType = parseImageTypeString(imageTypeString);
    const displayOrder = parseDisplayString(
      displayString as keyof typeof DisplayType,
    );

    if (name.length > 90) {
      // Discord max embed title is 100 so let's be safe and make it smaller.
      return interaction.editReply(
        `Hey! Discord only allows 100 characters max for their embed titles. Try making the category name simple and make the rest the category description!`,
      );
    } else if (await GET_CATEGORY_BY_NAME(interaction.guildId, name)) {
      return interaction.editReply(
        `Hey! It turns out you already have a category with that name made. Try checking it out.`,
      );
    }

    const hexRegex = new RegExp(/[0-9A-F]{6}$/gi);
    const isCorrectHex = hexRegex.test(embedColor ?? '');

    // If the user input an incorrect hex value, just default to whatever
    if (!isCorrectHex && embedColor) {
      // This is a shade of purple I like :)
      embedColor = '945ad2';
    }

    try {
      await CREATE_GUILD_CATEGORY({
        guildId: interaction.guildId,
        name,
        description,
        mutuallyExclusive,
        displayRoles,
        requiredRoleId,
        excludedRoleId,
        displayOrder: displayOrder ?? DisplayType.alpha,
        imageType: imageType ?? 'card',
        imageUrl,
        embedColor,
      });

      this.log.info(
        `Successfully created category[${name}]`,
        interaction.guildId,
      );

      const invalidHex = `\n\nAn invalid hex code was provided. Remember, hex codes look like this \`ff0000\`. Use an online tool to make one.`;

      await interaction.editReply(
        `Hey! I successfully created the category \`${name}\` for you!${(embedColor && !isCorrectHex) ? invalidHex : ''}`,
      );
    } catch (e) {
      this.log.error(
        `Issue creating category[${name}]\n${e}`,
        interaction.guildId,
      );

      await interaction.editReply(
        `Hey! I had some trouble creating that category for you. Please wait a minute and try again.`,
      );
    }
  };
}
