import { Message, RichEmbed, Role, TextChannel } from "discord.js"
import { getRoles, deleteRole, getJoinRoles } from "../../src/setup_table"

export default {
  desc: "Retrieves the list of roles that your server hands out.",
  name: "list",
  args: "",
  run: (message: Message, roleChannel?: TextChannel) => {
    const GUILD_ID = message.guild.id
    const DB_ROLES = getRoles(GUILD_ID).map(role => role.role_name)
    const J_ROLES = getJoinRoles(GUILD_ID)
    const embed = new RichEmbed()
    const GUILD_ROLES: string[] = []
    const PRIM_ROLES: Role[] = []
    const SEC_ROLES: Role[] = []
    const JOIN_ROLES: Role[] = []

    // If the DB has roles that the guild doesn't then the guild deleted them
    message.guild.roles.forEach(role => GUILD_ROLES.push(role.name))
    const DELETED_ROLES = DB_ROLES.filter(role => !GUILD_ROLES.includes(role))
    
    for(const role of DELETED_ROLES) {
      deleteRole.run(GUILD_ID, role)
    }
    // Just deleted some old roles so lets get this updated.
    const UPDATED_ROLES = getRoles(GUILD_ID)

    for(const [key, role] of message.guild.roles) {
      const r = UPDATED_ROLES.find(r => r.role_id === key)
      const jR = J_ROLES.find(r => r.role_id === key)

      if(r && r.prim_role === 1) {
        PRIM_ROLES.push(role)
      }
      else if(r && r.prim_role === 0) {
        SEC_ROLES.push(role)
      }
      if(jR) {
        JOIN_ROLES.push(role)
      }
    }

    embed
      .setColor(0xE229E2)
      .setDescription(`**Assignable Roles**`)
      .addField(`What to do`, `By typing a role name you'll be assigned the role.\nIf you have the role it'll be removed if you type it again.`, true)
      .addField(`_**PRIMARY ROLES**_`, 
                `${PRIM_ROLES.length > 0 ?
                   PRIM_ROLES.join(" ") : 
                   "No primary roles to give."}`)
      .addField(`_**SECONDARY ROLES**_`,
                `${SEC_ROLES.length > 0 ?
                  SEC_ROLES.join(" ") :
                  "No secondary roles to give."}`)
      .addField(`Roles given when users join the server`, 
                `${JOIN_ROLES.length > 0 ?
                  JOIN_ROLES.join(" ") : 
                  "No join roles to give."}`)
    
    if(roleChannel instanceof TextChannel) return roleChannel.send(embed)
    return message.channel.send(embed)
  }
}
