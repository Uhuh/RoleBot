import { GuildMember } from "discord.js"
import { getJoinRoles } from "../src/setup_table"

export default (member: GuildMember) => {
  const roles = getJoinRoles.all(member.guild.id)
  for (const role of roles) {
    for (const [key, gRole] of member.guild.roles) {
      if (key === role.role_id) {
        member.addRole(gRole)
      }
    }
  }
}
