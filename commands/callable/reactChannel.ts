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
    const GUILD_ID = message.guild.id;
    const roleChannel = message.mentions.channels.first();
    const REACT_ROLES = guildReactions(GUILD_ID);

    if (
      !roleChannel ||
      !message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])
    )
      return message.react("❌");

    //Send role list to channel so users don't have to
    const rMsg = (await reactList.run(message, roleChannel)) as Message;

    addReactMessage(rMsg.id, roleChannel.id, GUILD_ID);
    client.reactMessage.set(rMsg.id, rMsg);

    REACT_ROLES.forEach(r => {
      rMsg.react(r.emoji_id);
    });

    return message.react("✅");
  }
};
