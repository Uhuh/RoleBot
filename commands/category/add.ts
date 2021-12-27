import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageSelectMenu,
  Permissions,
  SelectMenuInteraction,
} from 'discord.js';
import {
  GET_CATEGORY_BY_ID,
  GET_GUILD_CATEGORIES,
  GET_REACT_ROLES_NOT_IN_CATEGORIES,
  GET_REACT_ROLE_BY_ROLE_ID,
} from '../../src/database/database';
import { SlashCommand } from '../slashCommand';
import { LogService } from '../../src/services/logService';
import { Category } from '../../utilities/types/commands';
import { spliceIntoChunks } from '../../utilities/functions/spliceChunks';
import RoleBot from '../../src/bot';

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
    const [reactRoleId, categoryId] = args;

    const reactRole = await GET_REACT_ROLE_BY_ROLE_ID(reactRoleId);
    const category = await GET_CATEGORY_BY_ID(categoryId);

    if (!reactRole) {
      LogService.error(
        `React role[${reactRoleId}] was not found with the given ID.`
      );

      return interaction.reply(
        `Hey! Something weird happened so I couldn't complete that request for you. Please wait a second and try again.`
      );
    }

    if (!category) {
      LogService.error(
        `Category[${categoryId}] was not found with the given ID.`
      );

      return interaction.reply(
        `Hey! Something weird happened so I couldn't complete that request for you. Please wait a second and try again.`
      );
    }

    if (reactRole.categoryId) {
      const reactRoleCategory = await GET_CATEGORY_BY_ID(reactRole.categoryId);

      LogService.debug(
        `React role[${reactRoleId}] is already in a category[${categoryId}]`
      );

      return interaction.reply(
        `Hey! This role is already in the category \`${reactRoleCategory?.name}\`.`
      );
    }

    if (category.roles.find((r) => r.roleId === reactRole.roleId)) {
      LogService.debug(
        `Category[${categoryId}] already contains role[${reactRoleId}]`
      );

      return interaction.reply(`Hey! This role is already in this category.`);
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

    const category = await GET_CATEGORY_BY_ID(categoryId);

    // I have no clue how this could happen after it just passed the categories ID.
    if (!category) {
      LogService.error(
        `Could not find category[${categoryId}] after it was selected in dropdown.`
      );
      return interaction.reply(
        `Hey! The category you selected... I can't find it. Does it exist anymore? Please wait a second and try running \`/${this.name}\` again.`
      );
    }

    const reactRoles = await GET_REACT_ROLES_NOT_IN_CATEGORIES(guildId);
    const reactRoleChunks = spliceIntoChunks(reactRoles, 5);

    const roleButtons: MessageActionRow[] = [];

    reactRoleChunks.map((chunk) =>
      roleButtons.push(
        new MessageActionRow().addComponents(
          chunk.map((r, i) =>
            new MessageButton()
              // commandName_reactMongoId-categoryMongoId
              .setCustomId(`${this.name}_${r.id}-${category.id}`)
              .setEmoji(r.emojiId)
              .setLabel(r.roleName)
              .setStyle(i % 2 ? 'SECONDARY' : 'PRIMARY')
          )
        )
      )
    );

    interaction.reply({
      ephemeral: true,
      content: `Let's see how this looks with buttons.`,
      components: roleButtons,
    });
  };

  execute = async (interaction: CommandInteraction) => {
    /** Discords SelectMenu limitations
     *  As far as I'm aware, according to the API docs we're only allowed to have 25 options inside a select menu.
     *  Because of this, I will limit users to a MAXIMUM of 25 categories. Which is a lot to have to begin with.
     */
    const categories = await GET_GUILD_CATEGORIES(interaction.guildId);

    if (!categories.length) {
      LogService.debug(
        `Guild[${interaction.guildId}] has no categories to add react roles to.`
      );
      return interaction.reply(
        `Hey! There are no categories, go create one with \`/category-create\` and then try again.`
      );
    }

    const hasReactRoles = (
      await GET_REACT_ROLES_NOT_IN_CATEGORIES(interaction.guildId)
    ).length;

    if (!hasReactRoles) {
      LogService.debug(
        `Guild[${interaction.guildId}] has no react roles to add to category.`
      );
      return interaction.reply(
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

    interaction.reply({
      ephemeral: true,
      content: `Hey! Select *one* category from below and then we'll move to adding react roles to it.`,
      components: [selectMenu],
    });
  };
}
