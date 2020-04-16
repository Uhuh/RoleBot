import { Message } from "discord.js"
import { joinRoles } from "../../src/setup_table"
import RoleBot from "../../src/bot"

export default {
  desc:
    "Users are given this role upon joining.\n" +
    "E.G: `@RoleBot join Member`",
  name: "join",
  args: "",
  type: "message",
  run: (message: Message, args: string[], client: RoleBot) => {
    // ignore them plebians
    if (
      !message.guild ||
      !message.member!.hasPermission(["MANAGE_ROLES"])
    )
      return
    if (!args.length) return message.channel.send("No arguments provided.\n`@RoleBot role <type> <name>`")
    const roleName = args.join(" ");

    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase())

    if (role) {
      message.react("✅");
      client.joinRoles.get(message.guild.id)!.push({
        id: role.id,
        name: role.name
      })
      return joinRoles.run({
        id: `${message.guild.id}-${role.id}`,
        role_name: role.name,
        role_id: role.id,
        guild_id: message.guild.id
      });
    }

    return message.react("❌");
  }
}
