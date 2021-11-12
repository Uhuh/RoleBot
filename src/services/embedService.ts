import { MessageEmbed, User } from 'discord.js';
import ViviBot from '../../src/bot';
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
   * @param prefix Prefix for the guild so that the help command correctly reflects what's used
   * @param client Vivi client to filter commands.
   * @returns Return built embed
   */
  public static helpEmbed = (type: string, prefix: string, client: ViviBot) => {
    const embed = new MessageEmbed();

    embed
      .setTitle(`**${type.toUpperCase()} commands**`)
      .setColor(COLOR.AQUA)
      .setDescription('***<> = required arguments, [] = optional.***\n\n');

    // I wanna keep the "config" prefix whenever a config command is ran. Don't judge me
    const config = type === 'config' ? 'config ' : '';

    client.commands
      .filter((c) => c.type === type)
      .forEach((func) => embed.addField(`**${func.name}`, func.desc));

    return embed;
  };
}
