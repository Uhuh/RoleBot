import { Message, TextChannel } from "discord.js";
import RoleBot from "../../src/bot";
import { rolesByFolderId } from "../../src/setup_table";

export default {
  desc: "Update a messages reactions. EG: `@RoleBot reaction -update 660203902193 [-id 1]`",
  name: "-update",
  args: "<msg_id> [-id <folder_id>]",
  type: "reaction",
  run: async (message: Message, args: string[], client: RoleBot): Promise<void> => {
    if (!message.guild || !message.member!.hasPermission(["MANAGE_ROLES"])) {
      message.react("❌");
      return;
    }
    const GUILD_ID = message.guild.id;

    if(!args.length) return;

    const MSG_ID = args.shift();

    if(!MSG_ID) {
      message.channel.send("No message id given. :(");
      return;
    }

    if(!client.reactMessage.includes(MSG_ID)) {
      message.channel.send("The message you want updated doesn't seem to have been used for roles before.");
      return;
    }

    let MSG = {} as Message;

    for(const [, c] of message.guild.channels) {
      if(c instanceof TextChannel && c.messages.fetch(MSG_ID)) {
        MSG = await c.messages.fetch(MSG_ID);
        break;
      }
    }

    if(args.length && args[0] === "-id") {
      const FOLDERS = client.guildFolders.get(GUILD_ID);
      if(!FOLDERS) {
        message.channel.send("No folders to add to.").then(m => setTimeout(() => m.delete(), 5000));
        return;
      }
      args.shift();
      
      const FOLDER_ID = Number(args[0]);
      if (Number.isNaN(FOLDER_ID) || FOLDER_ID < 0 || FOLDER_ID >= FOLDERS.length) {
        message.channel.send("Incorrect folder ID given. Try running `@RoleBot folder -list`").then(m => setTimeout(() => m.delete(), 5000));
        return;
      }
    
      const folder = client.folderContents.get(FOLDERS[FOLDER_ID].id);
      
      if(!folder) throw new Error("Folder not found, cannot add roles");

      if (!folder.roles.length) {
        message.channel.send(`\`${folder.label}\` has no roles. Make sure you sent the right ID.`).then(m => setTimeout(() => m.delete(), 5000));
        return;
      }

      MSG.reactions.removeAll();

      for(const role of folder.roles) {
        MSG.react(role.emoji_id);
      }

      return;
    }

    const FOLDERLESS_ROLES = rolesByFolderId(GUILD_ID, null);

    if(!FOLDERLESS_ROLES.length) {
      message.channel.send("There are no free roles, add some or check for folders with roles.");
      return;
    }

    MSG.reactions.removeAll();

    for(const role of FOLDERLESS_ROLES) {
      MSG.react(role.emoji_id);
    }
  }
};
