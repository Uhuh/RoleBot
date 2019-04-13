import { Message } from "discord.js"
import { joinRoles } from "../../src/setup_table"

export default (message: Message, roleName: string) => {
  if(!roleName) return message.channel.send("No role provided.\n`@RoleBot role join <role name>`")

  for (const [key, r] of message.guild.roles) {
    if (r.name.toLowerCase() === roleName.toLowerCase()) {
      message.react("✅")
      return joinRoles.run({
        id: `${message.guild.id}-${key}`,
        role_name: r.name,
        role_id: key,
        guild_id: message.guild.id
      })
    }
  }
  return message.guild
    .createRole({
      name: roleName,
      color: "BLUE"
    })
    .then(r => {
      joinRoles.run({
        id: `${r.id}-${message.guild.id}`,
        role_name: r.name,
        role_id: r.id,
        guild_id: message.guild.id
      })
      message.react("✅")
    })
    .catch(() => {
      message.react("❌")
    })
}

// check if the role exist
// if not create it and assign to list of join roles.
// if it does make it a join role
// push changes to sql db
