import { Message, Guild } from "discord.js";
import { addRole } from "../../src/setup_table";
import joinRole from "../events/joinRole";

export default {
  desc: "Add a role to your hand out role list",
  name: "role",
  args: "<Role name>",
  run: (message: Message, args: string[]) => {
    // ignore them plebians
    if (
      !message.guild ||
      !message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])
    )
      return;

    let role: any = {};
    let roleType = args.shift()!.toLowerCase();
    let name: string = "";

    const guild: Guild = message.guild;
    // So people like putting spaces in the role names, so this just adds them together.
    name = args.join(" ");

    if (roleType === "join") return joinRole(message, name);

    for (const [key, r] of message.guild.roles) {
      if (r.name.toLowerCase() === name.toLowerCase()) {
        role = {
          id: `${guild.id}-${key}`,
          role_name: r.name,
          role_id: key,
          guild: guild.id,
          prim_role: roleType === "prim" ? 1 : 0
        };
        addRole.run(role);
        message.react("✅");
        return;
      }
    }

    message.react("❌");
  }
};
