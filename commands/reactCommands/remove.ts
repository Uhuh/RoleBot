import { Message } from "discord.js";
import { removeReactionRole, guildReactions } from "../../src/setup_table";
import RoleBot from "../../src/bot";

export default {
  desc: "Delete a reaction role. Use `-all` to delete all current reactions.",
  name: "-remove",
  args: "<role name> or -all",
  type: "reaction",
  run: (message: Message, args: string[], client: RoleBot) => {
    if (!message.guild || (message.member && !message.member!.hasPermission(["MANAGE_ROLES"])))
      return message.react("❌");
    const arg = args.join(" ");
    const GUILD_ID = message.guild.id;
    const DB_ROLES = guildReactions(GUILD_ID).map(r => r.role_id);
    const ROLE = message.guild.roles.cache.find(
      r => r.name.toLowerCase() === arg.toLowerCase()
    );
    const FOLDERS = client.guildFolders.get(GUILD_ID) || []
    let found = false;

    if (ROLE && DB_ROLES.includes(ROLE.id)) {
      for(const f of FOLDERS) {
        const folder = client.folderContents.get(f.id)

        if(!folder) continue;

        for(const r of folder.roles) {
          if (r.role_id === ROLE.id) {
            folder.roles.splice(folder.roles.indexOf(r), 1);
            found = true;
            client.folderContents.set(f.id, folder);
            break;
          }
        }
        if (found) break;
      }
      removeReactionRole(ROLE.id);
      return message.react("✅");
    } else if (arg.includes("-all")) {
      DB_ROLES.forEach(r => {
        for(const f of FOLDERS) {
          found = false;
          const folder = client.folderContents.get(f.id)

          if(!folder) continue;

          for(const role of folder.roles) {
            if (role.role_id === r) {
              folder.roles.splice(folder.roles.indexOf(r), 1);
              found = true;
              client.folderContents.set(f.id, folder);
              break;
            }
          }
        }
        removeReactionRole(r)
      });
      return message.react("✅");
    }

    return message.react("❌");
  }
};
