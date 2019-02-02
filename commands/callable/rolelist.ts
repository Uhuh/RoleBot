import { Message } from "discord.js";
import RoleBot from "../../src/bot";
import { getRoles } from "../../src/setup_table";

export default {
  desc: "Retrives the list of roles that your server hands out.",
  name: "list",
  args: "",
  run: (message: Message, args: string[], client: RoleBot) => {
    let list = "```";
    const roles = getRoles.all(message.guild.id);
    for (const role of roles) {
      list += `${role.role_name}\n`;
    }
    list += "```";
    message.channel.send(list);
  }
};
