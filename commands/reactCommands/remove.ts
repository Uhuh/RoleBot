import { Message } from "discord.js";
import { removeReactionRole, removeReactionRoleNullFolder, guildReactions } from "../../src/setup_table";
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
    const DB_ROLES = guildReactions(GUILD_ID);

    const DB_ROLE = DB_ROLES
      .find(r => (
        r.role_name.toLowerCase() === arg.toLowerCase()
      ));
    
    if(DB_ROLE) {
      const folder = client.folderContents.get(DB_ROLE.folder_id);

      if(folder) {
        folder.roles.splice(folder.roles.indexOf(DB_ROLE.role_id), 1);
        client.folderContents.set(folder.id, folder);
      }

      removeReactionRole(DB_ROLE.id);
      return message.react("✅");
    } 
    else if (arg.includes("-all")) {
      removeReactionRoleNullFolder();
      for(const [id, folder] of client.folderContents) {
        folder.roles.forEach(r => {
          folder.roles.splice(folder.roles.indexOf(r), 1);
          removeReactionRole(r.role_id);
        });
        client.folderContents.set(id, folder);
      }
      return message.react("✅");
    }
    
    return message.react("❌");
  }
};
