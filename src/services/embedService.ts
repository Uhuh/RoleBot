import { MessageEmbed, User } from 'discord.js';
import { COLOR } from '../../utilities/types/globals';
import { ICategoryDoc } from '../database/category';
import { IReactRole } from '../database/reactRole';
import RoleBot from '../../src/bot';
import { GET_REACT_ROLES_BY_CATEGORY_ID } from '../database/database';

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
      .forEach((func) => embed.addField(`**/${func.name}**`, func.desc));

    return embed;
  };

  /**
   * Generate an embed that contains all the emojis to roles in a category.
   * @param category Category to parse roles from.
   * @param client RoleBot to find emojis.
   * @returns built embed.
   */
  public static categoryReactRoleEmbed = async (
    category: ICategoryDoc,
    client: RoleBot
  ) => {
    const embed = new MessageEmbed();
    const categoryRoles = await GET_REACT_ROLES_BY_CATEGORY_ID(category.id);

    const reactRoles = categoryRoles.length
      ? categoryRoles
          .map(
            (r) =>
              `${client.emojis.resolve(r.emojiId) ?? r.emojiId} - <@&${
                r.roleId
              }>`
          )
          .join('\n')
      : `This category has no react roles! Add some react roles to this category by using \`/category-add\`!`;

    embed
      .setTitle(category.name)
      .setDescription(`${category.description}\n\n${reactRoles}`)
      .setColor(COLOR.DEFAULT);

    return embed;
  };

  public static reactRoleListEmbed = (
    reactRoles: IReactRole[],
    client: RoleBot
  ) => {
    const embed = new MessageEmbed();

    const reactRolesFormattedString = reactRoles
      .map(
        (r) =>
          `${client.emojis.resolve(r.emojiId) ?? r.emojiId} - <@&${r.roleId}>\n`
      )
      .join('');

    embed
      .setTitle(`All your reaction roles!`)
      .setDescription(
        `This doesn't show what categories these roles are in. Check out \`/category-list\` for more in-depth listing.\n\n${reactRolesFormattedString}`
      )
      .setColor(COLOR.DEFAULT);

    return embed;
  };
}
