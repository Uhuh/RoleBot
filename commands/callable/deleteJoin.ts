import { Message } from "discord.js"
import { deleteJoin, getJoinRoles } from "../../src/setup_table"

export default {
  desc: "Remove a role from the join list. You must match the name exactly as it is in the server.\nE.G: `@RoleBot deleteJoin Role Name`",
  name: "deleteJoin",
  args: "<role name>",
  run: (message: Message, args: string[]) => {
    if (!message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])) return message.react("❌")
    const name = args.join(" ")
    const guildID = message.guild.id
    const DB_ROLES = getJoinRoles(message.guild.id).map(role => role.role_name)

    if (DB_ROLES.includes(name)) {
      deleteJoin.run(guildID, name)
      return message.react("✅")
    }

    return message.react("❌")
  }
}