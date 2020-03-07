import { Message, MessageEmbed } from "discord.js";
import RoleBot from "../../src/bot";

export default {
  desc: "Sends a list of all available commands.",
  name: "help",
  args: "",
  type: "normal",
  run: function(message: Message, args: string[], client: RoleBot) {
    const embed = new MessageEmbed();
    const type = args.length ? args[0] : "normal";
    const clientUser = client.user!

    embed
      .setTitle("Invite me to your server!")
      .setURL(
        `https://discordapp.com/oauth2/authorize?client_id=${clientUser.id}&scope=bot&permissions=269315264`
      )
      .setDescription(
        `[Support server](https://discord.gg/nJBubXy)\n[🤖Vote for me!](https://top.gg/bot/493668628361904139/vote)\n\n
          Anything inside a pair of [] are optional for the command
        `
      )
      .setColor(16711684)
      .setAuthor(clientUser.username, clientUser.avatarURL() || "")
      .setThumbnail(clientUser.avatarURL() || "")
      .setFooter("Have a great day :D")
      .setTimestamp(new Date());

    for (const func of client.commands.values()) {
      if (func.type === "dev" || func.type !== type) continue;

      embed.addField(
        `**@${clientUser.username} ${func.name} ${func.args}**`,
        `${func.desc}`
      );
    }
    embed.addField(
      "To get the commands for reaction or message based roles, run the commands below",
      "`@RoleBot help reaction` or `@RoleBot help message`"
    );
    message.channel.send({ embed });
  }
};
