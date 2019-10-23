import { Message } from "discord.js"
import { joinRoles, getRoles } from "../../src/setup_table"

export default (message: Message, roleName: string) => {
  if(!roleName) return message.channel.send("No role provided.\n`@RoleBot role join <role name>`")
  const PRIM_SEC_ROLES = getRoles(message.guild.id).map(role => role.role_id)


  for (const [key, r] of message.guild.roles) {
    if(r.name.toLowerCase() === roleName.toLowerCase() &&
      PRIM_SEC_ROLES.includes(r.id)) {
        return message.channel.send(`Cannot create a join role of an already existing prim/sec role.\n` +
                              `Run \`@RoleBot deleteRole ${r.name}\` then try again.`)
    }

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

  return message.react("❌")
}

// check if the role exist
// if it does make it a join role
// push changes to sql db
