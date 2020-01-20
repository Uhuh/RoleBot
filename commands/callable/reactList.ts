import { Message, MessageEmbed, TextChannel } from "discord.js";
import RoleBot, { Folder } from "../../src/bot";
import { rolesByFolderId } from "../../src/setup_table";

export default {
  desc: "All emojis associated with a role",
  name: "reactlist",
  args: "",
  type: "reaction",
  run: (message: Message, roleChannel?: TextChannel, folder?: Folder) => {

    if(!message.guild) return
    
    let { label, roles } = folder || { label: "Server Roles", roles: [] }
    if(folder instanceof RoleBot || !folder) {
      label = "Server roles";
      roles = rolesByFolderId(message.guild.id, null);
    }

    const embed = new MessageEmbed();

    embed.setTitle(`**${label}**`);
    embed.setColor("#cffc03");

    console.log(roles)

    if(roles.length) {
      let desc = ""
      for(const r of roles)
          desc += `${message.guild!.emojis.get(r.emoji_id) || r.emoji_id} - ${r.role_name}\n`

      embed.setDescription(desc)
    }
    else
      embed.setDescription(`There are no reaction roles`)

    if (roleChannel instanceof TextChannel) return roleChannel.send(embed);

    return message.channel.send(embed);
  }
};
