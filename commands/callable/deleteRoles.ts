import { Message } from "discord.js"
import { deleteRole, getRoles } from "../../src/setup_table"

export default {
  desc: "Delete a single role from your hand out roles list.",
  name: "deleteRole",
  args: "<role name>",
  run: (message: Message, args: string[]) => {
    if (!message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])) return message.react("❌")
    const name = args.join(" ")
    const guildID = message.guild.id
    const DB_ROLES = getRoles.all(message.guild.id).map(role => role.role_name)

    if (DB_ROLES.includes(name)) {
      deleteRole.run(guildID, name)
      return message.react("✅")
    }

    return message.react("❌")
  }
}