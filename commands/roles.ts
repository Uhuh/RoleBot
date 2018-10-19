import Bowsette from "../src/bot"
import { Message, GuildMember } from "discord.js"
export default async function (client: Bowsette, message: Message) {
  const member = message.member
  const role = message.content
  const guildRoles = client.getRoles.all(message.guild.id)
  let addedRole: boolean = false
  let req_role: string = ""
  message.delete()

  // IF they already have the role, ignore.
  if(member.roles.find(val => val.name === role)) {
    return
  }

  // Make sure the server has the role to give.
  for (const gR of guildRoles) {
    if (gR.role_name && gR.role_name.toLowerCase() === role.toLowerCase()) {
      req_role = role.toLowerCase()
      addedRole = await (member.addRole(gR.role_id)
      .then(() => { return true })
      .catch(() => { return false }))
      // if a secondary role don't remove previously given role.
      if (gR.prim_role === 0) {
        return
      }
      break
    }
    // No need to loop again if role was granted.
    if (addedRole) break
  }
  for (const [k, role] of member.roles) {
    for (const gR of guildRoles) {
      if ((gR.role_name.toLowerCase() === role.name.toLowerCase()) && (role.name.toLowerCase() !== req_role) && addedRole && gR.prim_role == 1) {
        member.removeRole(gR.role_id)
        return
      }
    }
  }
}