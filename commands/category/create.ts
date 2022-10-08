import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import {
  CREATE_GUILD_CATEGORY,
  GET_CATEGORY_BY_NAME,
} from '../../src/database/queries/category.query';

import { Category } from '../../utilities/types/commands';
import { handleInteractionReply } from '../../utilities/utils';
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
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const [name, description] = this.extractStringVariables(
      interaction,
      'category-name',
      'category-desc'
    );

    const mutuallyExclusive =
      interaction.options.getBoolean('mutually-exclusive') ?? false;

    const requiredRoleId =
      interaction.options.getRole('required-role')?.id ?? null;

    if (!name) {
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! It says you submitted no category name! You need to submit that. Please try again.`,
      });
    } else if (name.length > 90) {
      // Discord max embed title is 100 so let's be safe and make it smaller.
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! Discord only allows 100 characters max for their embed titles. Try making the category name simple and make the rest the category description!`,
      });
    }

    if (await GET_CATEGORY_BY_NAME(interaction.guildId, name)) {
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! It turns out you already have a category with that name made. Try checking it out.`,
      });
    }

    CREATE_GUILD_CATEGORY({
      guildId: interaction.guildId,
      name,
      description,
      mutuallyExclusive,
      requiredRoleId,
    })
      .then(() => {
        this.log.info(
          `Successfully created category[${name}]`,
          interaction.guildId
        );
        handleInteractionReply(this.log, interaction, {
          ephemeral: true,
          content: `Hey! I successfully created the category \`${name}\` for you!`,
        });
      })
      .catch((e) => {
        this.log.error(
          `Issue creating category[${name}]\n${e}`,
          interaction.guildId
        );
        handleInteractionReply(this.log, interaction, {
          ephemeral: true,
          content: `Hey! I had some trouble creating that category for you. Please wait a minute and try again.`,
        });
      });
  };
}
