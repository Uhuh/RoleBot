import { Message } from "discord.js"
import { joinRoles } from "../../src/setup_table"

export default {
  desc:
    "Users are given this role upon joining.\n" +
    "E.G: `@RoleBot role join Member`",
  name: "role",
  args: "join <Role name>",
  type: "message",
  run: (message: Message, args: string[]) => {
    // ignore them plebians
    if (
      !message.guild ||
      !message.member!.hasPermission(["MANAGE_ROLES"])
    )
      return
    if (!args.length) return message.channel.send("No arguments provided.\n`@RoleBot role <type> <name>`")
    
    const roleName = args.join(" ")

    
    const role = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName)

    if (role) {
      message.react("✅")
      return joinRoles.run({
        id: `${message.guild.id}-${role.id}`,
        role_name: role.name,
        role_id: role.id,
        guild_id: message.guild.id
      })
    }

    return message.react("❌")
  }
}
