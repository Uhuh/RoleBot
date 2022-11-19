import {
  ActionRowBuilder,
  AutocompleteInteraction,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from 'discord.js';
import { GET_CATEGORY_BY_ID } from '../../src/database/queries/category.query';
import { SlashCommand } from '../slashCommand';
import { Category } from '../../utilities/types/commands';
import {
  handleInteractionReply,
  spliceIntoChunks,
} from '../../utilities/utils';
import { ReactRole } from '../../src/database/entities';
import {
  GET_REACT_ROLES_BY_CATEGORY_ID,
  GET_REACT_ROLES_NOT_IN_CATEGORIES,
  GET_REACT_ROLE_BY_ID,
  UPDATE_REACT_ROLE_BY_ID,
  UPDATE_REACT_ROLE_CATEGORY,
} from '../../src/database/queries/reactRole.query';
import { handleAutocompleteCategory } from '../../utilities/utilAutocomplete';

export class AddCategoryCommand extends SlashCommand {
  constructor() {
    super(
      'category-add',
      'Add reaction roles to a specific category.',
      Category.category,
      [PermissionsBitField.Flags.ManageRoles]
    );

    this.addStringOption(
      'category',
      'The category you want to add react roles to!',
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

  /**
   * Should add the respective react role to the category selected.
   * @param interaction Button that contains role and category IDs
   * @param args A tuple of the [reactRoleId, categoryId] respectively.
   */
  handleButton = async (interaction: ButtonInteraction, args: string[]) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const [reactRoleId, categoryId] = args;

    const reactRole = this.expect(
      await GET_REACT_ROLE_BY_ID(Number(reactRoleId)),
      {
        message: '',
        prop: 'react role',
      }
    );

    const category = this.expect(await GET_CATEGORY_BY_ID(Number(categoryId)), {
      message: ``,
      prop: 'category',
    });

    // To edit our button message with the updated list of react roles.
    const rolesWithoutCategories = (
      (await GET_REACT_ROLES_NOT_IN_CATEGORIES(interaction.guildId)) ?? []
    ).filter((r) => r.roleId !== reactRole?.roleId);

    const categoryRoles = await GET_REACT_ROLES_BY_CATEGORY_ID(
      Number(categoryId)
    );

    // Should only get here if typeorm throws.
    if (!categoryRoles) {
      this.log.error(
        `Unable to find category roles for category[${categoryId}]`,
        interaction.guildId
      );
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: ``,
      });
    }

    if (categoryRoles.length >= 20) {
      this.log.info(
        `Category[${categoryId}] already has 20 react roles in it.`,
        interaction.guildId
      );
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: ``,
      });
    }

    if (reactRole.categoryId) {
      const reactRoleCategory = await GET_CATEGORY_BY_ID(reactRole.categoryId);

      this.log.info(
        `React role[${reactRoleId}] is already in a category[${categoryId}]`,
        interaction.guildId
      );

      handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: ``,
      });
    }

    const roleButtons = await this.buildReactRoleButtons(
      rolesWithoutCategories,
      Number(categoryId)
    );

    try {
      await UPDATE_REACT_ROLE_CATEGORY(Number(reactRoleId), Number(categoryId));
      await UPDATE_REACT_ROLE_BY_ID(Number(reactRoleId), {
        categoryAddDate: new Date(),
      });
      const moreRoles = ``;
      const noRolesLeft = ``;

      await interaction.update({
        content: roleButtons.length ? moreRoles : noRolesLeft,
        components: roleButtons,
      });

      this.log.info(
        `Successfully updated roles[${reactRoleId}] categoryId[${categoryId}]`,
        interaction.guildId
      );
    } catch (e) {
      this.log.error(
        `Failed to update roles[${reactRoleId}] categoryId[${categoryId}]\n${e}`,
        interaction.guildId
      );

      return interaction.update({
        content: ``,
      });
    }
  };

  /**
   * Build react roles without a category into buttons to send to the user.
   * @param reactRoles Used to generate buttons with.
   * @param categoryId Needed to help creating the buttons customId to parse later.
   * @returns All the react roles as buttons.
   */
  private buildReactRoleButtons = async (
    reactRoles: ReactRole[],
    categoryId: number
  ) => {
    const reactRoleChunks = spliceIntoChunks(reactRoles, 5);

    return reactRoleChunks.map((chunk) =>
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        chunk.map((r, i) =>
          new ButtonBuilder()
            // commandName_reactId-categoryId
            .setCustomId(`${this.name}_${r.id}-${categoryId}`)
            .setEmoji(r.emojiId)
            .setLabel(r.name)
            .setStyle(i % 2 ? ButtonStyle.Secondary : ButtonStyle.Primary)
        )
      )
    );
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const { guildId } = interaction;
    const categoryId = interaction.options.getString('category');

    if (categoryId && isNaN(Number(categoryId))) {
      return interaction.reply({
        ephemeral: true,
        content: ``,
      });
    }

    const category = this.expect(await GET_CATEGORY_BY_ID(Number(categoryId)), {
      message: '',
      prop: 'category',
    });

    const reactRoles = await GET_REACT_ROLES_NOT_IN_CATEGORIES(guildId);

    if (!reactRoles.length) {
      return interaction.reply({
        ephemeral: true,
        content: ``,
      });
    }

    const roleButtons = await this.buildReactRoleButtons(
      reactRoles,
      category.id
    );

    interaction
      .reply({
        ephemeral: true,
        components: roleButtons,
        content: ``,
      })
      .catch((e) => {
        this.log.error(
          `Failed to send category[${category.id}] buttons\n${e}`,
          interaction.guildId
        );
        handleInteractionReply(this.log, interaction, {
          ephemeral: true,
          content: '',
        });
      });
  };
}
