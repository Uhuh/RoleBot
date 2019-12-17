import { Message } from "discord.js";
import { removeReactionRole, guildReactions } from "../../src/setup_table";

export default {
  desc: "Delete a reaction role.",
  name: "deleteReact",
  args: "<role name>",
  run: (message: Message, args: string[]) => {
    if (!message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"]))
      return message.react("❌");
    const name = args.join(" ");
    const GUILD_ID = message.guild.id;
    const DB_ROLES = guildReactions(GUILD_ID).map(r => r.role_id);
    const ROLE = message.guild.roles.find(
      r => r.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    );

    if (ROLE && DB_ROLES.includes(ROLE.id)) {
      removeReactionRole(ROLE.id);
      return message.react("✅");
    }

    return message.react("❌");
  }
};
