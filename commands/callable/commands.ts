import { Message, MessageEmbed } from "discord.js";
import RoleBot from "../../src/bot";

export default {
  desc: "Sends a list of all available commands.",
  name: "help",
  args: "",
  type: "normal",
  run: function(message: Message, _args: string[], client: RoleBot) {
    const embed = new MessageEmbed();
    const clientUser = client.user!

    embed
      .setTitle("Invite me to your server!")
      .setURL(
        `https://discordapp.com/oauth2/authorize?client_id=${clientUser.id}&scope=bot&permissions=269315264`
      )
      .setDescription(
        `[Support server](https://discord.gg/nJBubXy)\n[🤖Vote for me!](https://top.gg/bot/493668628361904139/vote)\n[📝Documentation](https://app.gitbook.com/@duwtgb/s/rolebot/)
          
          Anything inside a pair of [] are optional for the command
        `
      )
      .setColor(16711684)
      .setAuthor(clientUser.username, clientUser.avatarURL() || "")
      .setThumbnail(clientUser.avatarURL() || "")
      .setTimestamp(new Date());

    for (const func of client.commands.values()) {
      if (func.type === 'dev') continue;

      embed.addField(
        `**@${clientUser.username} ${func.name} ${func.args}**`,
        `${func.desc}`
      );
    }
    message.channel.send({ embed });
  }
};
