import { Message } from "discord.js";
import { removeReactionRole, removeReactionRoleNullFolder, guildReactions } from "../../src/setup_table";
import RoleBot from "../../src/bot";

export default {
  desc: "Delete a reaction role. Use `-all` to delete all current reactions.",
  name: "remove",
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

    console.log(DB_ROLE);
    
    if(DB_ROLE) {
      const folder = client.folderContents.get(Number(DB_ROLE.folder_id));

      if(folder) {
        const role = folder.roles.find(r => r.role_id === DB_ROLE.role_id);
        if(!role) return console.error(`Role ${args} somehow not in folder but is in database.`);
        console.log(`Removing role from folder`);
        console.log(role);

        folder.roles.splice(folder.roles.indexOf(role), 1);
        client.folderContents.set(folder.id, folder);
      }

      removeReactionRole(DB_ROLE.role_id);
      return message.react("✅");
    } 
    else if (arg.includes("-all")) {
      removeReactionRoleNullFolder(GUILD_ID);
      const folders = client.guildFolders.get(GUILD_ID) || [];

      for(const f of folders) {
        const folder = client.folderContents.get(f.id);

        if(!folder) continue;
        
        folder.roles.forEach(r => {
          removeReactionRole(r.role_id);
        })
        folder.roles = [];
        client.folderContents.set(f.id, folder);
      }
      return message.react("✅");
    }

    return message.react("❌");
  }
};
