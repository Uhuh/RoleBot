import { Message } from "discord.js";
import { addFolder, folderId } from "../../src/setup_table";
import RoleBot from "../../src/bot";

export default {
  desc: "Create a folder.",
  name: "-new",
  args: "<A name for the folder>",
  type: "reaction",
  run: (message: Message, args: string[], client: RoleBot): void => {
    setTimeout(() => {
      message.delete();
    }, 5000);
    if (!message.guild || !message.member!.hasPermission(["MANAGE_ROLES"])) {
      message.react("❌");
      return;
    }
    const GUILD_ID = message.guild.id;

    const folderName = args.join(" ");
    let folder: { id: number | null; label: string } = { id: null, label: "" }

    if (args.length && folderName !== "") {
      const folders = client.guildFolders.get(GUILD_ID) || [];

      if (folders.length)
        folder = folders.find(f => f.label.toLowerCase() === folderName.toLowerCase()) || { id: null, label: "" };

      if (folder.id === null) {
        addFolder(GUILD_ID, folderName);
        // There should only be one Id per name...
        const ID = folderId(GUILD_ID, folderName);

        client.guildFolders.set(GUILD_ID, [...folders, { id: ID[0].id, label: folderName }]);

        folder = { id: ID[0].id, label: folderName };

        if(folder.id === null) throw new Error("New folder id is null");

        client.folderContents.set(folder.id, { id: folder.id, label: folder.label, guild_id: GUILD_ID, roles: [] })
      } else {
        message.channel.send(`Folder \`${folderName}\` already exist.`).then(m => setTimeout(() => m.delete(), 5000));
      }
    }
  }
};
