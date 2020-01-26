import { Message, MessageEmbed, TextChannel, Guild } from "discord.js";
import RoleBot, { Folder } from "../../src/bot";
import { rolesByFolderId } from "../../src/setup_table";

export default {
  desc: "All emojis associated with a role",
  name: "-list",
  args: "",
  type: "reaction",
  run: (message: Message, roleChannel: TextChannel, folder: Folder) => {
    if (!message.guild) return

    const { guild } = message

    let { roles } = folder || { roles: [] }

    if (folder instanceof RoleBot) {
      const folders = folder.guildFolders.get(guild.id)
      roles = rolesByFolderId(message.guild.id, null);

      message.channel.send(generateEmbed("Server Roles", roles, guild))

      if (!folders) return;

      folders.forEach(f => {
        const contents = folder.folderContents.get(f.id)
        
        if (!contents) throw new Error("Folder contents DNE");

        const R = contents.roles

        if(!R.length) return;

        message.channel.send(generateEmbed(f.label, R, guild));
      })

      return;
    } else if (!folder) {
      roles = rolesByFolderId(message.guild.id, null)
    }


    if (roleChannel instanceof TextChannel) 
      return roleChannel.send(generateEmbed(folder.label, roles, guild));

    return message.channel.send(generateEmbed(folder.label, roles, guild));
  }
};

const generateEmbed = (label: string, roles: any[], guild: Guild): MessageEmbed => {
  const embed = new MessageEmbed();

  embed.setTitle(`**${label}**`);
  embed.setColor("#cffc03");

  if (roles.length) {
    let desc = ""
    for (const r of roles)
      desc += `${guild.emojis.get(r.emoji_id) || r.emoji_id} - ${r.role_name}\n`

    embed.setDescription(desc)
  } else
    embed.setDescription(`There are no reaction roles`)

  return embed;
}