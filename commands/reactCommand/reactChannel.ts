import { Message } from "discord.js";
import { addReactMessage, rolesByFolderId } from "../../src/setup_table";
import reactList from "./reactList";
import RoleBot, { Role } from "../../src/bot";

export default {
  desc:
    "Will send a message with the roles and reaction message in a specific channel.",
  name: "-channel",
  args: "<channel mention>",
  type: "reaction",
  run: async (message: Message, _args: string[], client: RoleBot) => {
    setTimeout(() => {
      message.delete().then(() => console.log("Deleted ReactChannel command"));
    }, 5000);

    if (!message.guild || !message.member!.hasPermission(["MANAGE_ROLES"]))
      return message.react("❌");

    const GUILD_ID = message.guild.id;
    const roleChannel = message.mentions.channels.first();
    const FOLDERS_INFO = client.guildFolders.get(GUILD_ID) || []
    const GUILD_FOLDERS = [...FOLDERS_INFO]
    // I want to enforce the non folder roles.
    GUILD_FOLDERS.unshift({ id: 0, label: "" })
    let rMsg = {} as Message

    if (!roleChannel) return;

    for (const f of GUILD_FOLDERS) {
      //Send role list to channel so users don't have to
      const folder = client.folderContents.get(f.id || 0) || { 
        id: null, label: "Server Roles", guild_id: "", roles: rolesByFolderId(GUILD_ID, null) 
      }
      const { roles } = folder

      if (!roles.length && folder.id) continue;

      //@ts-ignore
      rMsg = (await reactList.run(message, roleChannel, folder)) as Message;

      addReactMessage(rMsg.id, roleChannel.id, GUILD_ID);
      client.reactMessage.set(rMsg.id, rMsg);

      const REACT_ROLES = RolesChunks(20, roles);

      if(!REACT_ROLES.length) continue;

      for (const r of REACT_ROLES[0]) {
        rMsg.react(r.emoji_id);
      }

      // Discord messages only allow 20 reactions per message, so split the reactions into arrays of 20 per.
      for (let i = 1; i < REACT_ROLES.length; i++) {
        const msg = await roleChannel.send("\u200b\n");
        addReactMessage(msg.id, roleChannel.id, GUILD_ID);
        client.reactMessage.set(msg.id, msg);
        REACT_ROLES[i].forEach(r => {
          msg.react(r.emoji_id);
        });
      }
    }

    return message.react("✅");
  }
};



const RolesChunks = (chunkSize: number, ROLES: Role[]) => {
  let roles = [];

  for (let i = 0; i < ROLES.length; i += chunkSize) {
    roles.push(ROLES.slice(i, i + chunkSize));
  }

  return roles;
};
