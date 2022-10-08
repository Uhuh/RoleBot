import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  PermissionsBitField,
  SelectMenuBuilder,
  SelectMenuInteraction,
} from 'discord.js';
import {
  GET_CATEGORY_BY_ID,
  GET_GUILD_CATEGORIES,
} from '../../src/database/queries/category.query';
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
  UPDATE_REACT_ROLE_CATEGORY,
} from '../../src/database/queries/reactRole.query';

export class AddCategoryCommand extends SlashCommand {
  constructor() {
    super(
      'category-add',
      'Add reaction roles to a specific category.',
      Category.category,
      [PermissionsBitField.Flags.ManageRoles]
    );
  }

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

    const reactRole = await GET_REACT_ROLE_BY_ID(Number(reactRoleId));
    const category = await GET_CATEGORY_BY_ID(Number(categoryId));

    // To edit our button message with the updated list of react roles.
    const rolesWithoutCategories = (
      (await GET_REACT_ROLES_NOT_IN_CATEGORIES(interaction.guildId)) ?? []
    ).filter((r) => r.roleId !== reactRole?.roleId);

    const categoryRoles = await GET_REACT_ROLES_BY_CATEGORY_ID(
      Number(categoryId)
    ).catch((e) =>
      this.log.critical(
        `Failed to get react roles with categoryId[${categoryId}]\n${e}`,
        interaction.guildId ?? ''
      )
    );

    // Should only get here if typeorm throws.
    if (!categoryRoles) {
      this.log.error(
        `Unable to find category roles for category[${categoryId}]`,
        interaction.guildId
      );
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! For some reason I don't see any react roles in that category. If this issues persist please report it to the support server.`,
      });
    }

    const unknownErrorMessage = `Hey! Something weird happened so I couldn't complete that request for you. Please wait a second and try again.`;

    if (!reactRole) {
      this.log.debug(
        `React role[${reactRoleId}] was not found with the given ID.`,
        interaction.guildId
      );

      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: unknownErrorMessage,
      });
    }

    if (!category) {
      this.log.debug(
        `Category[${categoryId}] was not found with the given ID.`,
        interaction.guildId
      );

      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: unknownErrorMessage,
      });
    }

    if (categoryRoles.length >= 20) {
      this.log.info(
        `Category[${categoryId}] already has 20 react roles in it.`,
        interaction.guildId
      );
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! Category \`${category.name}\` already has the max of 20 react roles. This is due to Discords reaction limitation. Make another category!`,
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
        content: `Hey! This role is already in the category \`${reactRoleCategory?.name}\`.`,
      });
    }

    const roleButtons = await this.buildReactRoleButtons(
      rolesWithoutCategories,
      Number(categoryId)
    );

    try {
      await UPDATE_REACT_ROLE_CATEGORY(Number(reactRoleId), Number(categoryId));
      const moreRoles = `I've added \`${reactRole.name}\` to \`${category.name}\`, you can add more roles if you wish.`;
      const noRolesLeft = `I've added \`${reactRole.name}\` to \`${category.name}\`. If you want to add more you need to create more react roles first.`;

      interaction
        .update({
          content: roleButtons.length ? moreRoles : noRolesLeft,
          components: roleButtons,
        })
        .catch((e) =>
          this.log.error(
            `Failed to update interaction\n${e}`,
            interaction.guildId ?? ''
          )
        );

      this.log.info(
        `Successfully updated roles[${reactRoleId}] categoryId[${categoryId}]`,
        interaction.guildId
      );
    } catch (e) {
      this.log.error(
        `Failed to update roles[${reactRoleId}] categoryId[${categoryId}]\n${e}`,
        interaction.guildId
      );

      interaction
        .update({
          content: `Hey! I had an issue adding \`${reactRole.name}\` to the category \`${category.name}\`. Please wait a second and try again.`,
        })
        .catch((e) =>
          this.log.error(
            `Failed to update interaction\n${e}`,
            interaction.guildId ?? ''
          )
        );
    }
  };

  /**
   * Prompt users to select roles from button menu that will be put into the selected category.
   * @param interaction When a category is selected.
   * @param args IDs that were in the category selection values.
   * @returns void to escape early if errors.
   */
  handleSelect = async (interaction: SelectMenuInteraction, args: string[]) => {
    const [guildId, categoryId] = args;

    const category = await GET_CATEGORY_BY_ID(Number(categoryId));

    // I have no clue how this could happen after it just passed the categories ID.
    if (!category) {
      this.log.error(
        `Could not find category[${categoryId}] after it was selected in dropdown.`,
        interaction.guildId
      );
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! The category you selected... I can't find it. Does it exist anymore? Please wait a second and try running \`/${this.name}\` again.`,
      });
    }

    const reactRoles = await GET_REACT_ROLES_NOT_IN_CATEGORIES(guildId);

    const roleButtons = await this.buildReactRoleButtons(
      reactRoles,
      category.id
    );

    interaction
      .update({
        content: `Below are reaction roles and their respective emojis. Click the buttons you want to add to the category \`${category.name}\`.`,
        components: roleButtons,
      })
      .catch((e) => {
        this.log.error(
          `Failed to send category[${category.id}] buttons\n${e}`,
          interaction.guildId
        );
        handleInteractionReply(this.log, interaction, {
          ephemeral: true,
          content:
            `Hey! I had an issue making some buttons for you. Sometimes emojis aren't supported, like iPhone emojis, please make sure to use Discords emoji picker.` +
            `\nIf the problem persist please visit the support server found in the \`/info\` command so we can figure out the issue!`,
        });
      });
  };

  /**
   * Build react roles without a category into buttons to send to the user.
   * @param guildId Needed to get the correct react roles.
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
            // commandName_reactMongoId-categoryMongoId
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
    /** Discords SelectMenu limitations
     *  As far as I'm aware, according to the API docs we're only allowed to have 25 options inside a select menu.
     *  Because of this, I will limit users to a MAXIMUM of 25 categories. Which is a lot to have to begin with.
     */
    const categories = await GET_GUILD_CATEGORIES(interaction.guildId);

    if (!categories.length) {
      this.log.debug(
        `Guild has no categories to add react roles to.`,
        interaction.guildId
      );
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! There are no categories, go create one with \`/category-create\` and then try again.`,
      });
    }

    const hasReactRoles = (
      await GET_REACT_ROLES_NOT_IN_CATEGORIES(interaction.guildId)
    ).length;

    if (!hasReactRoles) {
      this.log.debug(
        `Guild has no react roles to add to category.`,
        interaction.guildId
      );
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! Before trying to add react roles to a category, make sure you created some. Try out \`/react-role\` to create some!`,
      });
    }

    // Value format: `commandName_guildID-categoryId`
    const selectMenu = new ActionRowBuilder<SelectMenuBuilder>().addComponents(
      new SelectMenuBuilder()
        .setCustomId(`select-${this.name}`)
        .setPlaceholder('Pick a category')
        .addOptions(
          categories.map((c) => ({
            label: c.name,
            value: `${this.name}_${interaction.guildId}-${c.id}`,
          }))
        )
    );

    interaction
      .reply({
        ephemeral: true,
        content: `Hey! Select *one* category from below and then we'll move to adding react roles to it.`,
        components: [selectMenu],
      })
      .catch((e) =>
        this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
      );
  };
}
