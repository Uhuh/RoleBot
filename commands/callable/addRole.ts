import { Message, Guild } from "discord.js"
import { addRole, getJoinRoles } from "../../src/setup_table"
import joinRole from "../events/joinRole"

export default {
  desc:
    "Add a role to your hand out role list\n" +
    "prim = primary, it will replace any other primary role\n" +
    "sec = secondary and will stack with other secondary's and primaries\n" +
    "join = when a user joins the server they will be auto assigned this role.\n" +
    "You cannot make a join role if the role is currently a prim/sec role and vice versa.",
  name: "role",
  args: "<prim | sec | join> <Role name>",
  run: (message: Message, args: string[]) => {
    // ignore them plebians
    if (
      !message.guild ||
      !message.member.hasPermission(["MANAGE_ROLES_OR_PERMISSIONS"])
    )
      return
    if (!args.length) return message.channel.send("No arguments provided.\n`@RoleBot role <type> <name>`")
    
    const JOIN_ROLES = getJoinRoles.all(message.guild.id).map(role => role.role_id)
    const guild: Guild = message.guild

    let role: any = {}
    let roleType = args.shift()!.toLowerCase()
    let name: string = ""

    // So people like putting spaces in the role names, so this just adds them together.
    name = args.join(" ")

    
    if (roleType === "join") return joinRole(message, name)
    if (roleType !== "prim" && roleType !== "sec" ) 
      return message.channel.send("Role type was not: `prim` `sec` or `join`.\n`@RoleBot role <type> RoleName`")
    if(!name) return message.channel.send(`No role provided.\n\`@RoleBot role ${roleType} <role>\``)

    for (const [key, r] of message.guild.roles) {
      if(r.name.toLowerCase() === name.toLowerCase() &&
        JOIN_ROLES.includes(r.id)) {
          return message.channel.send(`Cannot create a ${roleType} role of an already existing join role.\n` +
                              `Run \`@RoleBot deleteJoin ${r.name}\` then try again.`)
      }

      if (r.name.toLowerCase() === name.toLowerCase()) {
        role = {
          id: `${guild.id}-${key}`,
          role_name: r.name,
          role_id: key,
          guild: guild.id,
          prim_role: roleType === "prim" ? 1 : 0
        }
        addRole.run(role)
        return message.react("✅")
      }
    }

    return message.react("❌")
  }
}
