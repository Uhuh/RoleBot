import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { DisplayType } from '../../src/database/entities/category.entity';
import {
  CREATE_GUILD_CATEGORY,
  GET_CATEGORY_BY_NAME,
} from '../../src/database/queries/category.query';

import { Category } from '../../utilities/types/commands';
import {
  getDisplayCommandValues,
  parseDisplayString,
} from '../../utilities/utils';
import { SlashCommand } from '../slashCommand';

export class CreateCategoryCommand extends SlashCommand {
  constructor() {
    super(
      'category-create',
      'Create a new category to categorize your reaction roles in.',
      Category.category,
      [PermissionsBitField.Flags.ManageRoles]
    );

    this.addStringOption('category-name', 'The name of the category', true);
    this.addStringOption('category-desc', 'Give your category a description.');
    this.addBoolOption(
      'mutually-exclusive',
      `Make roles from this category mutually exclusive.`
    );
    this.addRoleOption(
      'required-role',
      'Require users to have a certain role to obtain roles from this category.'
    );
    this.addRoleOption(
      'excluded-role',
      'Users with this role cannot obtain roles from this category.'
    );
    this.addStringOption(
      'display-order',
      'Change how the category displays the react roles.',
      false,
      getDisplayCommandValues()
    );
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    const [name, description] = this.extractStringVariables(
      interaction,
      'category-name',
      'category-desc'
    );

    const mutuallyExclusive =
      interaction.options.getBoolean('mutually-exclusive') ?? false;

    const requiredRoleId =
      interaction.options.getRole('required-role')?.id ?? null;

    const excludedRoleId =
      interaction.options.getRole('excluded-role')?.id ?? null;

    const displayString = interaction.options.getString('display-order');

    const displayOrder = parseDisplayString(
      displayString as keyof typeof DisplayType
    );

    if (!name) {
      return interaction.editReply(
        `Hey! It says you submitted no category name! You need to submit that. Please try again.`
      );
    } else if (name.length > 90) {
      // Discord max embed title is 100 so let's be safe and make it smaller.
      return interaction.editReply(
        `Hey! Discord only allows 100 characters max for their embed titles. Try making the category name simple and make the rest the category description!`
      );
    }

    if (await GET_CATEGORY_BY_NAME(interaction.guildId, name)) {
      return interaction.editReply(
        `Hey! It turns out you already have a category with that name made. Try checking it out.`
      );
    }

    CREATE_GUILD_CATEGORY({
      guildId: interaction.guildId,
      name,
      description,
      mutuallyExclusive,
      requiredRoleId,
      excludedRoleId,
      displayOrder,
    })
      .then(() => {
        this.log.info(
          `Successfully created category[${name}]`,
          interaction.guildId
        );

        return interaction.editReply(
          `Hey! I successfully created the category \`${name}\` for you!`
        );
      })
      .catch((e) => {
        this.log.error(
          `Issue creating category[${name}]\n${e}`,
          interaction.guildId
        );

        return interaction.editReply(
          `Hey! I had some trouble creating that category for you. Please wait a minute and try again.`
        );
      });
  };
}
