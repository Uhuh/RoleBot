import { Message } from "discord.js";
import { deleteFolder } from "../../src/setup_table";
import RoleBot from "../../src/bot";

export default {
  desc: "Delete a folder.",
  name: "remove",
  args: "-f <folder id>",
  type: "reaction",
  run: (message: Message, args: string[], client: RoleBot) => {
    setTimeout(() => {
      message.delete();
    }, 5000);
    if (!message.guild || !message.member!.hasPermission(["MANAGE_ROLES"]))
      return message.react("❌");
    const GUILD_ID = message.guild.id;

    if(!args.length || (args.length && args[0] !== "-f")) return;
    if(!client.guildFolders.get(GUILD_ID)) 
      return message.channel.send("There are no folders to delete.")
              .then(m => setTimeout(() => m.delete(), 5000))
    
    args.shift();

    const ARRAY_ID = Number(args[0]);

    if (Number.isNaN(ARRAY_ID) || ARRAY_ID < 0 || ARRAY_ID >= client.guildFolders.get(GUILD_ID)!.length) return;
    
    const FOLDER_ID = client.guildFolders.get(GUILD_ID)![ARRAY_ID].id
    const {id, label, roles} = client.folderContents.get(FOLDER_ID)!

    deleteFolder(id);
    client.guildFolders.get(GUILD_ID)!.splice(ARRAY_ID, 1);
    client.folderContents.delete(FOLDER_ID);

    return message.channel.send(`Folder \`${label}\` has been deleted. It's ${roles.length} Roles are no longer associated with it.`)
      .then(m => setTimeout(() => m.delete(), 10000));
  }
};
