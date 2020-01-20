import { Message, MessageEmbed, } from "discord.js";
import RoleBot from "../../src/bot";
import { rolesByFolderId } from "../../src/setup_table";

export default {
  desc: "All role folders. If an id is given it list the roles within the folder.",
  name: "folders",
  args: "[-id <folder id>]",
  type: "reaction",
  run: (message: Message, args: string[], client: RoleBot) => {
    if (!message.guild) return

    setTimeout(() => {
      message.delete();
    }, 5000);

    const GUILD_ID = message.guild.id;
    const FOLDERS = client.guildFolders.get(GUILD_ID);
    const embed = new MessageEmbed();
    embed.setColor("#cffc03");

    if (FOLDERS && args.length && args[0].includes("-id")) {
      args.shift();
      const folderId = Number(args[0]);

      if (Number.isNaN(folderId) || folderId < 0 || folderId >= FOLDERS.length) {
        return message.channel.send("Incorrect folder ID given. Try running `@RoleBot folders`").then(m => setTimeout(() => m.delete(), 5000));
      }

      const {roles} = client.folderContents.get(FOLDERS[folderId].id)!;
      embed.setTitle(`**${FOLDERS[folderId].label}**'s roles`);
      if (roles.length) {
        embed.setDescription(
          roles.map(r => `${message.guild!.emojis.get(r.emoji_id) || r.emoji_id} - ${r.role_name}`)
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

    embed.addField("‏‏‎  Reaction roles not in a folder.‎", `[ Free Roles ] - [${SIZE} ${SIZE > 1 ? `Roles` : `Role`}]`)
    embed.addField("‏‏‎‏‏‎  ", "React with ⬇️ to see free roles.")

    if (FOLDERS && FOLDERS.length) {
      embed.setDescription(
        FOLDERS.map((f, index) => {
          const folder = client.folderContents.get(f.id)!
          return `[ ID ${index} ] - 📁**${f.label}** [${folder.roles.length} ${folder.roles.length > 1 ? `Roles` : "Role"}]`
        })
      )
    }
    else
      embed.setDescription(`There are no role folders.`)

    // if (roleChannel instanceof TextChannel) return roleChannel.send(embed);

    return message.channel.send(embed).then(m => {
      m.react("⬇️")
      m.awaitReactions((r, user) => r.emoji.name === "⬇️" && user.id === message.author.id, { maxEmojis: 1 })
        .then(() => {
          const embed = new MessageEmbed();
          embed.setTitle("**Free Roles**");
          if (FOLDERLESS_ROLES.length) {
            embed.setDescription(
              FOLDERLESS_ROLES.map(r => `${message.guild!.emojis.get(r.emoji_id) || r.emoji_id} - ${r.role_name}`)
            )
          } else {
            embed.setDescription("No free roles!")
          }

          return m.edit(embed)
        })
        .catch(console.error)
    });
  }
};
