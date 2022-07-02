import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  Permissions,
  SelectMenuInteraction,
} from 'discord.js-light';
import {
  GET_CATEGORY_BY_ID,
  GET_GUILD_CATEGORIES,
  GET_REACT_ROLES_BY_CATEGORY_ID,
  GET_REACT_ROLES_NOT_IN_CATEGORIES,
  GET_REACT_ROLE_BY_ID,
  UPDATE_REACT_ROLE_CATEGORY,
} from '../../src/database/database';
import { SlashCommand } from '../slashCommand';
import { Category } from '../../utilities/types/commands';
import {
  handleInteractionReply,
  spliceIntoChunks,
} from '../../utilities/utils';
import RoleBot from '../../src/bot';
import { ReactRole } from '../../src/database/entities';

export class AddCategoryCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'category-add',
      'Add reaction roles to a specific category.',
      Category.category,
      [Permissions.FLAGS.MANAGE_ROLES]
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
    const categorilessRoles = (
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
      return handleInteractionReply(
        this.log,
        interaction,
        `Hey! Something broke. But I'm working on it, please be patient!`
      );
    }

    const unknownErrorMessage = `Hey! Something weird happened so I couldn't complete that request for you. Please wait a second and try again.`;

    if (!reactRole) {
      this.log.debug(
        `React role[${reactRoleId}] was not found with the given ID.`,
        interaction.guildId
      );

      return handleInteractionReply(this.log, interaction, unknownErrorMessage);
    }

    if (!category) {
      this.log.debug(
        `Category[${categoryId}] was not found with the given ID.`,
        interaction.guildId
      );

      return handleInteractionReply(this.log, interaction, unknownErrorMessage);
    }

    if (categoryRoles.length >= 20) {
      this.log.info(
        `Category[${categoryId}] already has 20 react roles in it.`,
        interaction.guildId
      );
      return handleInteractionReply(
        this.log,
        interaction,
        `Hey! Category \`${category.name}\` already has the max of 20 react roles. This is due to Discords reaction limitation. Make another category!`
      );
    }

    if (reactRole.categoryId) {
      const reactRoleCategory = await GET_CATEGORY_BY_ID(reactRole.categoryId);

      this.log.info(
        `React role[${reactRoleId}] is already in a category[${categoryId}]`,
        interaction.guildId
      );

      handleInteractionReply(
        this.log,
        interaction,
        `Hey! This role is already in the category \`${reactRoleCategory?.name}\`.`
      );
    }

    const roleButtons = await this.buildReactRoleButtons(
      categorilessRoles,
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

    /**
     * Grab role from db
     * Grab category from db
     * Check that the role has no category set.
     * Update role and category to share relationship
     *
     */
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
      return handleInteractionReply(
        this.log,
        interaction,
        `Hey! The category you selected... I can't find it. Does it exist anymore? Please wait a second and try running \`/${this.name}\` again.`
      );
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
        handleInteractionReply(
          this.log,
          interaction,
          `Hey! I had an issue making some buttons for you. I suspect that one of the react role emojis isn't actually an emoji. Check out \`/react-list\` to confirm this.`
        );
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
      new MessageActionRow().addComponents(
        chunk.map((r, i) =>
          new MessageButton()
            // commandName_reactMongoId-categoryMongoId
            .setCustomId(`${this.name}_${r.id}-${categoryId}`)
            .setEmoji(r.emojiId)
            .setLabel(r.name)
            .setStyle(i % 2 ? 'SECONDARY' : 'PRIMARY')
        )
      )
    );
  };

  execute = async (interaction: CommandInteraction) => {
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
      return handleInteractionReply(
        this.log,
        interaction,
        `Hey! There are no categories, go create one with \`/category-create\` and then try again.`
      );
    }

    const hasReactRoles = (
      await GET_REACT_ROLES_NOT_IN_CATEGORIES(interaction.guildId)
    ).length;

    if (!hasReactRoles) {
      this.log.debug(
        `Guild has no react roles to add to category.`,
        interaction.guildId
      );
      return handleInteractionReply(
        this.log,
        interaction,
        `Hey! Before trying to add react roles to a category, make sure you created some. Try out \`/react-role\` to create some!`
      );
    }

    // Value format: `commandName_guildID-categoryId`
    const selectMenu = new MessageActionRow().addComponents(
      new MessageSelectMenu()
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
