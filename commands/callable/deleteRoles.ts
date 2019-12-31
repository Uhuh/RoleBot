import { Message } from "discord.js";
import { deleteRole, getRoles } from "../../src/setup_table";

export default {
  desc:
    "Delete a single role from your hand out roles list. You must match the name exactly as it is in the server.\nE.G: `@RoleBot deleteRole Role Name`",
  name: "deleteRole",
  args: "<role name>",
  type: "message",
  run: (message: Message, args: string[]) => {
    if (!message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])) return;
    const name = args.join(" ");
    const guildID = message.guild.id;
    const DB_ROLES = getRoles(message.guild.id).map(role => role.role_name);

    if (DB_ROLES.includes(name)) {
      deleteRole.run(guildID, name);
      return message.react("✅");
    }

    return message.react("❌");
  }
};
