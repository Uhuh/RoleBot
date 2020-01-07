import { Message } from "discord.js";
import { addReactMessage, guildReactions } from "../../src/setup_table";
import reactList from "./reactList";
import RoleBot from "../../src/bot";

export default {
  desc:
    "Will send a message with the roles and reaction message in a specific channel.",
  name: "reactChannel",
  args: "<channel mention>",
  type: "reaction",
  run: async (message: Message, _args: string[], client: RoleBot) => {
    setTimeout(() => {
      message.delete();
    }, 5000);
    
    if (!message.guild || !message.member!.hasPermission(["MANAGE_ROLES"]))
      return message.react("❌");

    const GUILD_ID = message.guild.id;
    const roleChannel = message.mentions.channels.first();
    const REACT_ROLES = guildReactions(GUILD_ID);

    if (!roleChannel) return;

    //Send role list to channel so users don't have to
    const rMsg = (await reactList.run(message, roleChannel)) as Message;

    addReactMessage(rMsg.id, roleChannel.id, GUILD_ID);
    client.reactMessage.set(rMsg.id, rMsg);

    const roles = RolesChunks(20, REACT_ROLES);

    roles[0].forEach(r => {
      rMsg.react(r.emoji_id);
    });

    // Discord messages only allow 20 reactions per message, so split the reactions into arrays of 20 per.
    for (let i = 1; i < roles.length; i++) {
      const msg = await message.channel.send("\u200b\n");
      addReactMessage(msg.id, roleChannel.id, GUILD_ID);
      client.reactMessage.set(msg.id, msg);
      roles[i].forEach(r => {
        msg.react(r.emoji_id);
      });
    }

    return message.react("✅");
  }
};

const RolesChunks = (chunkSize: number, ROLES: any[]) => {
  let roles = [];

  for (let i = 0; i < ROLES.length; i += chunkSize) {
    roles.push(ROLES.slice(i, i + chunkSize));
  }

  return roles;
};
