import { MessageEmbed, User } from 'discord.js';
import { COLOR } from '../../utilities/types/globals';
import { Category } from '../database/entities/category.entity';
import { ReactRole } from '../database/entities/reactRole.entity';
import RoleBot from '../../src/bot';
import { GET_REACT_ROLES_BY_CATEGORY_ID } from '../database/database';
import * as tutorialJson from '../../utilities/json/tutorial.json';

export class EmbedService {
  constructor() {}

  private static userTagInfo = (user: User | string): string => {
    return `${typeof user === 'string' ? user : user?.tag} (<@${
      typeof user === 'string' ? user : user.id
    }>)`;
  };

  /**
   * Generate a help embed based on the category type passed in.
   * @param type @Category type to filter out commands.
   * @param client Rolebot client to filter commands.
   * @returns Return built embed
   */
  public static helpEmbed = (type: string, client: RoleBot) => {
    const embed = new MessageEmbed();

    embed.setTitle(`**${type.toUpperCase()} commands**`).setColor(COLOR.AQUA);

    client.commands
      .filter((c) => c.type === type)
      .forEach((func) => embed.addField(`/${func.name}`, func.desc));

    return embed;
  };

  /**
   * Generate an embed that contains all the emojis to roles in a category.
   * @param category Category to parse roles from.
   * @param client RoleBot to find emojis.
   * @returns built embed.
   */
  public static categoryReactRoleEmbed = async (category: Category) => {
    const embed = new MessageEmbed();
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
        `Mutually exclusive: **${category.mutuallyExclusive}**\n\nDesc: **${desc}**\n\n${reactRoles}`
      )
      .setColor(COLOR.DEFAULT);

    return embed;
  };

  public static reactRolesFormattedString = (reactRoles: ReactRole[]) => {
    return reactRoles
      .map((r) => `${r.emojiTag ?? r.emojiId} - <@&${r.roleId}>`)
      .join('\n');
  };

  /**
   * Build a single embed to list all roles and their associated emoji.
   * @param reactRoles List of all react roles in a guild.
   * @param client Client used to grab emojis from.
   * @returns Built embed for caller command to send.
   */
  public static reactRoleListEmbed = (reactRoles: ReactRole[]) => {
    const embed = new MessageEmbed();

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
    const embed = new MessageEmbed();

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

    const embed = new MessageEmbed();

    embed
      .setTitle(category.name)
      .setDescription(`${category.description}\n\n${reactRolesString}`)
      .setColor(COLOR.DEFAULT);

    return embed;
  };

  public static tutorialEmbed = (pageId: number) => {
    /* Extract out all of the embed info needed to make this. Should be simple. */
    const embedJson = tutorialJson['embeds'][pageId];
    const embed = new MessageEmbed();

    embed
      .setColor(COLOR.DEFAULT)
      .setTitle(embedJson.title)
      .setDescription(embedJson.description);

    return embed;
  };
}
