import { Message, MessageEmbed, } from "discord.js";
import RoleBot from "../../src/bot";
import { rolesByFolderId } from "../../src/setup_table";

export default {
  desc: "All role folders. If an id is given it list the roles within the folder.",
  name: "list",
  args: "[folder id]",
  type: "folder",
  run: (message: Message, args: string[], client: RoleBot) => {
    if (!message.guild) return

    const GUILD_ID = message.guild.id;
    const FOLDERS = client.guildFolders.get(GUILD_ID);
    const embed = new MessageEmbed();
    embed.setColor("#cffc03");

    if (FOLDERS && args.length && !Number.isNaN(Number(args[0]))) {
      const folderId = Number(args[0]);

      if (Number.isNaN(folderId) || folderId < 0 || folderId >= FOLDERS.length) {
        return message.channel.send("Incorrect folder ID given. Try running `@RoleBot folders`");
      }

      const id = FOLDERS[folderId].id;

      if(!id) {
        return;
      }

      const folder = client.folderContents.get(id);

      if (!folder) throw new Error(`Folder ${FOLDERS[folderId].id} DNE`);

      const { roles } = folder;
      embed.setTitle(`**${FOLDERS[folderId].label}**'s roles`);
      if (roles && roles.length) {
        embed.setDescription(
          roles.map(r => `${message.guild!.emojis.cache.get(r.emoji_id) || r.emoji_id} - ${r.role_name}`)
        )
      } else
        embed.setDescription(`No roles in this folder.`)

      message.channel.send(embed)
      return;
    }

    // For roles not related to a folder
    const FOLDERLESS_ROLES = rolesByFolderId(GUILD_ID, null);
    const SIZE = FOLDERLESS_ROLES.length;

    embed.setTitle(`**Role Folders**`);

    embed.addField("‏‏‎Reaction roles not in a folder.‎", `[ Free Roles ] - [${SIZE} ${SIZE > 1 ? `Roles` : `Role`}]`)
    embed.addField("‏‏‎‏‏‎  ", "React with ⬇️ to see free roles.")

    if (FOLDERS && FOLDERS.length) {
      embed.setDescription(
        FOLDERS.map((f, index) => {
          if(!f.id) return;
          const folder = client.folderContents.get(f.id);
          if(!folder || !folder.roles) return;
          return `[ ID ${index} ] - 📁**${f.label}** [${folder.roles.length} ${folder.roles.length > 1 ? `Roles` : "Role"}]`
        })
      )
    }
    else
      embed.setDescription(`There are no role folders.`)

    // if (roleChannel instanceof TextChannel) return roleChannel.send(embed);

    return message.channel.send(embed).then(m => {
      m.react("⬇️");
      // Possibly add ability to go back to folders.
      // m.react("⬆️");
      m.awaitReactions((r, user) => r.emoji.name === "⬇️" && user.id === message.author.id, { maxEmojis: 1 })
        .then(() => {
          const embed = new MessageEmbed();
          embed.setTitle("**Free Roles**");
          if (FOLDERLESS_ROLES.length) {
            embed.setDescription(
              FOLDERLESS_ROLES.map(r => `${message.guild!.emojis.cache.get(r.emoji_id) || r.emoji_id} - ${r.role_name}`)
            )
          } else {
            embed.setDescription("No free roles!");
          }

          return m.edit(embed);
        })
        .catch(console.error);
    });
  }
};
