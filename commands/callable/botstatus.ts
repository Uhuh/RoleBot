import { Message, MessageEmbed } from "discord.js";
import RoleBot from "../../src/bot";

export default {
  desc: "Information about the bot",
  name: "botstatus",
  args: "",
  type: "normal",
  run: (message: Message, _args: string[], client: RoleBot) => {
    const embed = new MessageEmbed();
    let userCount = 0;
    let channelCount = 0;

    client.guilds.cache.forEach(g => {
      // Ignore DBL, they only list the bot. Not use it.
      if(g.id !== '264445053596991498') {
        userCount += g.memberCount;
        channelCount += g.channels.cache.size;
      }
    });

    embed
      .setColor(16711683)
      .setTitle(`**Bot Status**`)
      .setThumbnail(client.user!.avatarURL() || "")
      .addField(`**Bot Developer:**`, `Panku#0721`, true)
      .addField(`**The bot is in:**`, `${client.guilds.cache.size} servers`, true)
      .addField(`**The bot is watching:**`, `${userCount} users`, true)
      .addField(`**The bot is watching:**`, `${channelCount} channels`, true);
    message.channel.send(embed);
  }
};
