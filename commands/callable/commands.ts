import { Message, MessageEmbed } from 'discord.js';
import RoleBot from '../../src/bot';

export default {
  desc: 'Sends a list of all available commands.',
  name: 'help',
  args: '[category]',
  type: 'general',
  run: function (message: Message, args: string[], client: RoleBot) {
    const embed = new MessageEmbed();
    const { user } = client;

    if (!user) return;

    embed
      .setColor(16711684)
      .setAuthor(user.username, user.avatarURL() || '')
      .setThumbnail(user.avatarURL() || '')
      .setFooter(`Replying to: ${message.author.tag}`)
      .setTimestamp(new Date())
      .addField(
        `**Commands**`,
        `[In depth use of commands](https://app.gitbook.com/@duwtgb/s/rolebot/)`
      );

    if (!args.length) {
      embed.setTitle('**COMMAND CATEGORIES**');
      embed.addField(`**General**`, `Try out \`rb help general\``);
      embed.addField(`**Reaction**`, `Try out \`rb reaction help\``);
      embed.addField(`**Folder**`, `Try out \`rb folder help\``);
    } else if (args.length === 1) {
      args[0] = args[0].toLowerCase();
      if (
        args[0] !== 'reaction' &&
        args[0] !== 'folder' &&
        args[0] !== 'general'
      )
        return;

      embed.setTitle(`**${args[0].toUpperCase()} COMMANDS**`);
      for (const func of client.commands.values()) {
        if (args[0] === 'general') {
          embed.addField(`**rb ${func.name} ${func.args}**`, func.desc);
        } else if (args[0] === func.type) {
          embed.addField(
            `**rb ${func.type} ${func.name} ${func.args}**`,
            func.desc
          );
        }
      }
    }

    message.channel.send({ embed });
  },
};
