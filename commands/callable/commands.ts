import { Message, MessageEmbed } from "discord.js";
import RoleBot from "../../src/bot";
import reactionHandler from "./reactionHandler";
import folderHandler from "./folderHandler";

export default {
  desc: "Sends a list of all available commands.",
  name: "help",
  args: "[category]",
  type: "normal",
  run: function(message: Message, args: string[], client: RoleBot) {
    const embed = new MessageEmbed();
    const {user} = client;
    
    if(!user) return;
    embed
      .setDescription(
        `[Support server](https://discord.gg/nJBubXy)\n[🤖Vote for me!](https://top.gg/bot/493668628361904139/vote)          
        <> = required arguments, [] = optional.
        Mention or \`rb\` to use commands
        `
      )

    embed
      .setColor(16711684)
      .setAuthor(user.username, user.avatarURL() || "")
      .setThumbnail(user.avatarURL() || "")
      .setFooter(`Replying to: ${message.author.tag}`)
      .setTimestamp(new Date());
    
    if(!args.length) {
      embed.setTitle('**COMMAND CATEGORIES**')
      embed.addField(`**REACTION**`, `Try out \`rb help reaction\``);
      embed.addField(`**FOLDER**`, `Try out \`rb help folder\``);
    } 
    else if(args.length === 1) {
      args[0] = args[0].toLowerCase();
      if(args[0] !== 'reaction' && args[0] !== 'folder') {
        return;
      }
      embed.setTitle(`**${args[0].toUpperCase()} COMMANDS**`);

      if(args[0] === 'reaction') {
        embed.addField(`**DOCUMENTATION**`, `[In depth reaction documentation](https://app.gitbook.com/@duwtgb/s/rolebot/#reaction-roles)`)
        for (const func of reactionHandler.commands.values()) {
          embed.addField(`**rb reaction ${func.name} ${func.args}**`, `${func.desc}`);
        }
      } else if (args[0] === 'folder') {
        embed.addField(`**DOCUMENTATION**`, `[In depth folder documentation](https://app.gitbook.com/@duwtgb/s/rolebot/#folders)`)
        for (const func of folderHandler.commands.values()) {
          embed.addField(`**rb folder ${func.name} ${func.args}**`, `${func.desc}`);
        }
      }
    }

    message.channel.send({ embed });
  }
};
