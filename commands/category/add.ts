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
import { spliceIntoChunks } from '../../utilities/utils';
import { ReactRole } from '../../src/database/entities';
import {
  GET_REACT_ROLES_BY_CATEGORY_ID,
  GET_REACT_ROLES_NOT_IN_CATEGORIES,
  GET_REACT_ROLE_BY_ID,
  UPDATE_REACT_ROLE_BY_ID,
  UPDATE_REACT_ROLE_CATEGORY,
} from '../../src/database/queries/reactRole.query';
import { handleAutocompleteCategory } from '../../utilities/utilAutocomplete';
import { RolePing } from '../../utilities/utilPings';

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
        message: 'Failed to find the react role!',
        prop: 'react role',
      }
    );

    const category = this.expect(await GET_CATEGORY_BY_ID(Number(categoryId)), {
      message: `Failed to find the category!`,
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
      return interaction.reply({
        ephemeral: true,
        content: `Hey! For some reason I don't see any react roles in that category. If this issues persist please report it to the support server.`,
      });
    }

    if (categoryRoles.length >= 20) {
      this.log.info(
        `Category[${categoryId}] already has 20 react roles in it.`,
        interaction.guildId
      );
      return interaction.reply({
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

      return interaction.reply({
        ephemeral: true,
        content: `Hey! The role ${RolePing(
          reactRole.roleId
        )} is already in the category \`${reactRoleCategory?.name}\`.`,
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
      const moreRoles = `I've added ${RolePing(reactRole.roleId)} to \`${
        category.name
      }\`, you can add more roles if you wish.`;
      const noRolesLeft = `I've added ${RolePing(reactRole.roleId)} to \`${
        category.name
      }\`. If you want to add more you need to create more react roles first.`;

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
        content: `Hey! I had an issue adding ${RolePing(
          reactRole.roleId
        )} to the category \`${
          category.name
        }\`. Please wait a second and try again.`,
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

    await interaction.deferReply({
      ephemeral: true,
    });

    const { guildId } = interaction;
    const categoryId = interaction.options.getString('category');

    if (categoryId && isNaN(Number(categoryId))) {
      return interaction.editReply(
        `Hey! You need to wait for options to show before hitting enter. You entered "${categoryId}" which isn't a category here.`
      );
    }

    const category = this.expect(await GET_CATEGORY_BY_ID(Number(categoryId)), {
      message: 'I failed to find that category! Try again.',
      prop: 'category',
    });

    const reactRoles = await GET_REACT_ROLES_NOT_IN_CATEGORIES(guildId);

    if (!reactRoles.length) {
      return interaction.editReply(
        `You should create a few react roles first! Check out \`/react-role\`!`
      );
    }

    const roleButtons = await this.buildReactRoleButtons(
      reactRoles,
      category.id
    );

    interaction
      .editReply({
        components: roleButtons,
        content: `Below are reaction roles and their respective emojis. Click the buttons you want to add to the category \`${category.name}\`.`,
      })
      .catch((e) => {
        this.log.error(
          `Failed to send category[${category.id}] buttons\n${e}`,
          interaction.guildId
        );
        return interaction.editReply(
          `Hey! I had an issue making some buttons for you. Sometimes emojis aren't supported, like iPhone emojis, please make sure to use Discords emoji picker.` +
            `\nIf the problem persist please visit the support server found in the \`/info\` command so we can figure out the issue!`
        );
      });
  };
}
