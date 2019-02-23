import { Message, Guild } from "discord.js";
import { addRole } from "../../src/setup_table";
import joinRole from "../events/joinRole";

export default {
  desc:
    "Add a role to your hand out role list\n" +
    "prim = primary, it will replace any other primary role\n" +
    "sec = secondary and will stack with other secondary's and primaries\n" +
    "join = when a user joins the server they will be auto assigned this role.\n" +
    "If the role doesn't exist it's created and given a default color blue.",
  name: "role",
  args: "<prim | sec | join> <Role name>",
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
