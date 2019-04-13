import { Message, RichEmbed } from "discord.js";
import RoleBot from "../../src/bot";

export default {
  desc: "Sends a list of all available commands.",
  name: "help",
  args: "",
  run: async function(message: Message, args: string[], client: RoleBot) {
    const embed = new RichEmbed();

    embed
      .setTitle("Invite me to your server!")
      .setURL(
        "https://discordapp.com/oauth2/authorize?client_id=493668628361904139&scope=bot&permissions=8"
      )
      .setColor(16711684)
      .setAuthor(client.user.username, client.user.avatarURL)
      .setThumbnail(client.user.avatarURL)
      .setFooter("Have a great day :D")
      .setTimestamp(new Date());

    for (const func of client.commands.values()) {
      embed.addField(
        `**@${client.user.username} ${func.name} ${func.args}**`,
        `Description: ${func.desc}`
      );
    }
    message.author.send({ embed });
  }
};