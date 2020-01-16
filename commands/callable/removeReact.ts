import { Message } from "discord.js";
import { removeReactionRole, guildReactions } from "../../src/setup_table";

export default {
  desc: "Delete a reaction role. Use `-all` to delete all current reactions.",
  name: "deleteReact",
  args: "<role name>\n\t-all",
  type: "reaction",
  run: (message: Message, args: string[]) => {
    setTimeout(() => {
      message.delete();
    }, 5000);
    if (!message.guild || !message.member!.hasPermission(["MANAGE_ROLES"]))
      return message.react("❌");
    const arg = args.join(" ");
    const GUILD_ID = message.guild.id;
    const DB_ROLES = guildReactions(GUILD_ID).map(r => r.role_id);
    const ROLE = message.guild.roles.find(
      r => r.name.toLowerCase() === arg.toLowerCase()
    );

    if (ROLE && DB_ROLES.includes(ROLE.id)) {
      removeReactionRole(ROLE.id);
      return message.react("✅");
    } else if (arg.includes("-all")) {
      DB_ROLES.forEach(r => {
        removeReactionRole(r)
      });
      return message.react("✅");
    }

    return message.react("❌");
  }
};
