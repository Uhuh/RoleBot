import { MessageEmbed, User } from 'discord.js';
import RoleBot from '../../src/bot';
import { Category } from '../../utilities/types/commands';
import { COLOR } from '../../utilities/types/globals';

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

    // I did category stupidly so
    const slashPrefix = type === Category.category ? '/category ' : '';

    client.commands
      .filter((c) => c.type === type)
      .forEach((func) =>
        embed.addField(`**${slashPrefix}${func.name}**`, func.desc)
      );

    return embed;
  };
}
