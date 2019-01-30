import { Message, Guild } from "discord.js";
import { addRole } from "../../src/setup_table";
import joinRole from "../events/joinRole";

export default {
  name: "role",
  run: (message: Message, args: string[]) => {
    // ignore them plebians
    if (
      !message.guild ||
      !message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])
    )
      return;

    let role: any = {};
    let roleType = args.shift();
    let name: string = "";

    const regex = new RegExp("[0-9]+"); // I'm getting sick of having to grab the id from `\@roleName` so just regex the id out of it when passed in
    const guild: Guild = message.guild;
    // So people like putting spaces in the role names, so this just adds them together.
    name = args.join(" ");

    if (roleType!.toLowerCase() === "join") return joinRole(message, name);
    let id: string = args.pop()!;

    if (
      guild.roles.find(
        val =>
          val.name.toLowerCase() === name.toLowerCase() &&
          val.id === regex.exec(id)![0]
      ) &&
      (roleType === "sec" || roleType === "prim")
    ) {
      role = {
        id: `${guild.id}-${regex.exec(id)![0]}`,
        role_name: name,
        role_id: regex.exec(id)![0],
        guild: guild.id,
        prim_role: roleType === "prim" ? 1 : 0
      };
      addRole.run(role);
      message.react("✅");
      return;
    }
    message.react("❌");
  }
};
