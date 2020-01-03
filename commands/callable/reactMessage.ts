import { Message, TextChannel } from "discord.js";
import { addReactMessage, guildReactions } from "../../src/setup_table";
import RoleBot from "../../src/bot";

export default {
  desc: "Will watch a custom message for reactions.",
  name: "reactMessage",
  args: "<message id>",
  type: "reaction",
  run: async (message: Message, args: string[], client: RoleBot) => {
    if (!message.guild) return;

    const { guild } = message;
    const REACT_ROLES = guildReactions(guild.id);
    const M_ID = args[0];

    if (!message.member!.hasPermission(["MANAGE_ROLES"]))
      return message.react("❌");

    for (const [, ch] of guild.channels) {
      if (ch instanceof TextChannel) {
        const msg = await ch.messages.fetch(M_ID).catch(console.log);

        if (!msg) continue;

        REACT_ROLES.forEach(r => {
          msg.react(r.emoji_id);
        });

        addReactMessage(msg.id, ch.id, guild.id);
        client.reactMessage.set(msg.id, msg);

        break;
      }
    }

    return message.react("✅");
  }
};
