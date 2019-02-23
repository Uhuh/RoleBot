import { Message } from "discord.js";
import { deleteRole } from "../../src/setup_table";

export default {
  desc: "Delete a single role from your hand out roles list. ",
  name: "deleteRole",
  args: "<role name>",
  run: (message: Message, args: string[]) => {
    if (!message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])) return;
    const name = args.join("");
    const guildID = message.guild.id;
    let roleID: string = "";
    for (const [key, role] of message.guild.roles) {
      if (role.name.toLowerCase() === name.toLowerCase()) {
        roleID = role.id;
      }
    }

    deleteRole.run(guildID, roleID);
    message.react("✅");
  }
};
