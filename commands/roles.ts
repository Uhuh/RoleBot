import Bowsette from "../src/bot"
import { Message, GuildMember } from "discord.js"
export default async function (client: Bowsette, message: Message) {
  const member: GuildMember = message.member
  const words: string[] = message.content.split(' ')
  const guildRoles = client.getRoles.all(message.guild.id)
  let addedRole: boolean = false
  let req_role: string = ""
  message.delete()
  for (const i of words) {
    if(member.roles.find(val => val.name === i)) {
      return
    }
  }
  for (const word of words) {
    for (const gR of guildRoles) {
      if (gR.role_name === word.toLowerCase()) {
        req_role = word.toLowerCase()
        addedRole = await (member.addRole(gR.role_id)
        .then(() => { return true })
        .catch(() => { return false }))
        // if a secondary role don't remove any other
        if (gR.prim_role === 0) {
          return
        }
        break
      }
    }
    if (addedRole) break
  }
  for (const [k, role] of member.roles) {
    for (const gR of guildRoles) {
      if ((gR.role_name === role.name.toLowerCase()) && (role.name.toLowerCase() !== req_role) && addedRole && gR.prim_role == 1) {
        member.removeRole(gR.role_id)
        return
      }
    }
  }
}