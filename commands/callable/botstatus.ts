import { Message, RichEmbed } from "discord.js";
import * as OS from "os";
import RoleBot from "../../src/bot";
import { DEV_ID } from "../../src/vars";

export default {
  desc: 'Information about the bot',
  name: 'botstatus',
  args: '',
  run: (message: Message, _args: string[], client: RoleBot) => {

    const embed = new RichEmbed()
    let userCount = 0
    let channelCount = 0

    client.guilds.forEach(g => {
      userCount += g.memberCount;
      channelCount += g.channels.size;
    })

    embed.setColor(16711683)
      .setTitle(`**Bot Status**`)
      .setThumbnail(client.user.avatarURL)
      .addField(`**Bot Developer:**`, `Panku#0721`, true)
      .addField(`**The bot is in:**`, `${client.guilds.size} servers`, true)
      .addField(`**The bot is watching:**`, `${userCount} users`, true)
      .addField(`**The bot is watching:**`, `${channelCount} channels`, true)
      .addField(`**Ping:**`, `${client.ping} ms`, true)
      .addField(`**Bot OS:**`, `${OS.platform()}`, true)
    message.channel.send(embed)

    if(DEV_ID === message.author.id) {
      const gNames = client.guilds.map(g => `${g.name} - ${g.memberCount}`)
      const gIds = client.guilds.map(g => g.id)
      
      // Having issue detecting size of messages and how I should split it up since they get so large..
      message.channel.send(`\`\`\`${gNames.join("\n")} \`\`\``)
      message.channel.send(`\`\`\`${gIds.join("\n")} \`\`\``)
    }
  }
}
