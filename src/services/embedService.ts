import { EmbedBuilder, escapeMarkdown } from 'discord.js';
import { COLOR } from '../../utilities/types/globals';
import { Category } from '../database/entities/category.entity';
import { ReactRole } from '../database/entities/reactRole.entity';
import { Colors } from '../interfaces';
import { codeBlock } from '@discordjs/builders';
import { AVATAR_URL } from '../vars';
import { GET_REACT_ROLES_BY_CATEGORY_ID } from '../database/queries/reactRole.query';
import { RolePing } from '../../utilities/utilPings';
import { Category as CommandCategory } from '../../utilities/types/commands';
import tutorialJson from '../../utilities/json/tutorial.json';
import commands from '../../utilities/json/commands.json';

export class EmbedService {
  /**
   * Generate a help embed based on the category type passed in.
   * @param type @Category type to filter out commands.
   * @returns Return built embed
   */
  public static helpEmbed = (type: CommandCategory) => {
    const embed = new EmbedBuilder();

    embed.setTitle(`**${type.toUpperCase()} commands**`).setColor(COLOR.AQUA);

    commands[type].forEach((func) =>
      embed.addFields({ name: `/${func.name}`, value: func.description })
    );

    return embed;
  };

  /**
   * Generate an embed that contains all the emojis to roles in a category.
   * @param category Category to parse roles from.
   * @param client RoleBot to find emojis.
   * @returns built embed.
   */
  public static categoryReactRoleEmbed = async (category: Category) => {
    const embed = new EmbedBuilder();
    const categoryRoles = await GET_REACT_ROLES_BY_CATEGORY_ID(category.id);

    const reactRoles = categoryRoles.length
      ? this.reactRolesFormattedString(categoryRoles)
      : `This category has no react roles! Add some react roles to this category by using \`/category-add\`!`;

    const desc =
      category.description === '' || !category.description
        ? 'Description not set. Set it in `/category-edit`'
        : category.description;

    embed
      .setTitle(category.name)
      .setDescription(
        `Required Role: ${
          category.requiredRoleId ? RolePing(category.requiredRoleId) : 'None!'
        } \n\nMutually exclusive: **${
          category.mutuallyExclusive
        }**\n\nDesc: **${escapeMarkdown(desc)}**\n\n${reactRoles}`
      )
      .setColor(COLOR.DEFAULT);

    return embed;
  };

  public static reactRolesFormattedString = (reactRoles: ReactRole[]) => {
    return reactRoles
      .map((r) => `${r.emojiTag ?? r.emojiId} - ${RolePing(r.roleId)}`)
      .join('\n');
  };

  /**
   * Build a single embed to list all roles and their associated emoji.
   * @param reactRoles List of all react roles in a guild.
   * @returns Built embed for caller command to send.
   */
  public static reactRoleListEmbed = (reactRoles: ReactRole[]) => {
    const embed = new EmbedBuilder();

    const rolesNotInCategory = reactRoles.filter((r) => !r.categoryId);
    const rolesInCategory = reactRoles.filter((r) => r.categoryId);

    const inCategory = rolesInCategory.length
      ? `**In a category:**\n${this.reactRolesFormattedString(
          rolesInCategory
        )}\n`
      : '';

    const notInCategory = rolesNotInCategory.length
      ? `**Not in a category:**\n${this.reactRolesFormattedString(
          rolesNotInCategory
        )}`
      : '';

    embed
      .setTitle(`All your reaction roles!`)
      .setDescription(
        `This doesn't show what categories these roles are in.\nCheck out \`/category-list\` for more in-depth listing.\n\n${inCategory}${notInCategory}`
      )
      .setColor(COLOR.DEFAULT);

    return embed;
  };

  public static freeReactRoles = async (reactRoles: ReactRole[]) => {
    const embed = new EmbedBuilder();

    embed.setTitle(`React roles not in a category`).setColor(COLOR.YELLOW);

    embed.setDescription(
      `These roles are up for grabs!\nCheck out \`/category-add\` if you want to add these to a category.\n\n${this.reactRolesFormattedString(
        reactRoles
      )}`
    );

    return embed;
  };

  public static reactRoleEmbed = (
    reactRoles: ReactRole[],
    category: Category
  ) => {
    const reactRolesString = this.reactRolesFormattedString(reactRoles);

    const embed = new EmbedBuilder();

    const requiredRole = category.requiredRoleId
      ? `\nRequired: ${RolePing(category.requiredRoleId)}`
      : '';

    embed
      .setTitle(category.name)
      .setDescription(
        `${category.description}${requiredRole}\n\n${reactRolesString}`
      )
      .setColor(COLOR.DEFAULT);

    return embed;
  };

  public static tutorialEmbed = (pageId: number) => {
    /* Extract out all of the embed info needed to make this. Should be simple. */
    const embedJson = tutorialJson['embeds'][pageId];
    const embed = new EmbedBuilder();

    embed
      .setColor(COLOR.DEFAULT)
      .setTitle(embedJson.title)
      .setDescription(embedJson.description);

    return embed;
  };

  public static joinRoleEmbed = (roleIds: string[]) => {
    const embed = new EmbedBuilder();

    embed
      .setTitle(`Server auto join roles.`)
      .setColor(Colors.green)
      .setDescription(
        `These roles are given to users as they join your server.\nCurrently the max limit a server can have is 5.\n\n` +
          (roleIds.length > 0
            ? roleIds.map((r) => RolePing(r)).join('\n')
            : `There are none! Go add some with the \`/auto-join add @Role\` command.`)
      )
      .setTimestamp(new Date());

    return embed;
  };

  public static errorEmbed = (content: string) => {
    const embed = new EmbedBuilder();

    embed
      .setColor(Colors.red)
      .setAuthor({ name: 'RoleBot', iconURL: AVATAR_URL })
      .setTitle(`Encountered an error`)
      .setDescription(codeBlock(content))
      .setTimestamp(new Date());

    return embed;
  };
}
