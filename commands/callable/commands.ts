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
      embed.addField(
        `**General**`,
        `Wanna add auto(join) roles? Try out \`rb help general\``
      );
      embed.addField(`**Reaction**`, `Try out \`rb reaction help\``);
      embed.addField(`**Folder**`, `Try out \`rb folder help\``);
    } else {
      args[0] = args[0].toLowerCase();
      if (args[0] !== 'general') return;

      embed.setTitle(`**${args[0].toUpperCase()} COMMANDS**`);
      for (const func of client.commands.values()) {
        if (func.type !== args[0]) continue;
        embed.addField(`**rb ${func.name} ${func.args}**`, func.desc);
      }
    }

    embed.setDescription(
      `**Due to unfortunate events with Discord this version of RoleBot needs to be replaced with a new bot.** Good news however, the new RoleBot is getting an upgrade. It will certainly help remove most of the confusion that RoleBot creates with the complicated commands. It will be using slash commands due to Discords new rules for bots requiring to use slash commands.\nYou can join the [support server to invite the replacement bot](https://discord.gg/5sEEc347dc)`
    );

    message.channel.send({ embed });
  },
};
