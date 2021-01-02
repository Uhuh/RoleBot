import { Message, MessageEmbed } from 'discord.js';
import RoleBot from '../../src/bot';

export default {
  desc: 'Information about the bot',
  name: 'botstatus',
  args: '',
  type: 'general',
  run: (message: Message, _args: string[], client: RoleBot) => {
    const embed = new MessageEmbed();
    let userCount = 0;
    let channelCount = 0;

    client.guilds.cache.forEach((g) => {
      userCount += g.memberCount;
      channelCount += g.channels.cache.size;
    });
    embed.setDescription(
      `[Support server](https://discord.gg/nJBubXy)\n[🤖Vote for me!](https://top.gg/bot/493668628361904139/vote)          
        <> = required arguments, [] = optional.
        Mention or \`rb\` to use commands
        `
    );
    embed
      .setColor(16711683)
      .setTitle(`**Bot Status**`)
      .setThumbnail(client.user!.avatarURL() || '')
      .addField(`**Bot Developer:**`, `Panku#0721`, true)
      .addField(
        `**The bot is in:**`,
        `${client.guilds.cache.size} servers`,
        true
      )
      .addField(`**The bot is watching:**`, `${userCount} users`, true)
      .addField(`**The bot is watching:**`, `${channelCount} channels`, true);
    message.channel.send(embed);
  },
};
