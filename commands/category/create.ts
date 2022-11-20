import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import { DisplayType } from '../../src/database/entities/category.entity';
import {
  CREATE_GUILD_CATEGORY,
  GET_CATEGORY_BY_NAME,
} from '../../src/database/queries/category.query';

import { Category } from '../../utilities/types/commands';
import {
  getDisplayCommandValues,
  handleInteractionReply,
  parseDisplayString,
} from '../../utilities/utils';
import { SlashCommand } from '../slashCommand';
import * as i18n from 'i18n';

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

    const name = this.expect(interaction.options.getString('category-name'), {
      message: i18n.__('CATEGORY.CREATE.CATEGORY.INVALID_NAME'),
      prop: 'category-name',
    });

    const description = interaction.options.getString('category-desc');

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

    if (name.length > 90) {
      // Discord max embed title is 100 so let's be safe and make it smaller.
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: i18n.__('CATEGORY.CREATE.CATEGORY.MAX_NAME_LENGTH'),
      });
    }

    if (await GET_CATEGORY_BY_NAME(interaction.guildId, name)) {
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: i18n.__('CATEGORY.CREATE.CATEGORY.EXIST'),
      });
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
        handleInteractionReply(this.log, interaction, {
          ephemeral: true,
          content: i18n.__('CATEGORY.CREATE.SUCCESS', { name }),
        });
      })
      .catch((e) => {
        this.log.error(
          `Issue creating category[${name}]\n${e}`,
          interaction.guildId
        );
        handleInteractionReply(this.log, interaction, {
          ephemeral: true,
          content: i18n.__('CATEGORY.CREATE.FAILED'),
        });
      });
  };
}
