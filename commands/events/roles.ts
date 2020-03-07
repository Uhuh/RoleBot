import {Message} from "discord.js"
import {getRoles, getJoinRoles} from "../../src/setup_table"

export default async function (message: Message) {
  if(!message.guild) return

  const member = message.member!
  const role = message.content
  const guildRoles = getRoles(message.guild.id)
  const jRoles = getJoinRoles(message.guild.id).map(role => role.role_name)
  let addedRole: boolean = false
  let req_role: string = ""

  message.delete()
  // IF they already have the role, remove it.
  const roleToRemove = member.roles.cache.find(val => val.name.toLowerCase() === role.toLowerCase())
  if (roleToRemove && !jRoles.includes(roleToRemove.name)) {
    return member.roles.remove(roleToRemove)
      .then(member => console.log(`Removed ${roleToRemove.name} from ${member.displayName}`))
      .catch(console.error)
  }
  // Make sure the server has the role to give.
  for (const gR of guildRoles) {
    if (gR.role_name && gR.role_name.toLowerCase() === role.toLowerCase()) {
      req_role = role.toLowerCase()
      addedRole = await member
        .roles.add(gR.role_id)
        .then(() => {
          return true
        })
        .catch(() => {
          return false
        })
      // if a secondary role don't remove previously given role.
      if (!gR.prim_role) {
        return
      }
      break
    }
    // No need to loop again if role was granted.
    if (addedRole) break
  }
  for (const [k, role] of member.roles.cache) {
    for (const gR of guildRoles) {
      if (
        gR.role_name.toLowerCase() === role.name.toLowerCase() &&
        role.name.toLowerCase() !== req_role &&
        addedRole &&
        gR.prim_role == 1
      ) {
        member.roles.remove(k)
        return
      }
    }
  }
}
  