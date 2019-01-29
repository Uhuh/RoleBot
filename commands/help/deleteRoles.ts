import { Message } from "discord.js";
import { deleteRole } from "../../src/setup_table";

export default {
  name: "deleteRole",
  run: (message: Message, args: string[]) => {
    if (!message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])) return;

    const regex = new RegExp("[0-9]+");
    const guildID = message.guild.id;
    const roleID = regex.exec(args[0]);

    deleteRole.run(guildID, roleID);
    message.react("✅");
  }
};
