import { GuildMember, Collection } from "discord.js"

export default (member: GuildMember, joinRoles: Collection<string, {id: string, name: string}[]>) => {
  for (const role of joinRoles.get(member.guild.id) || []) {
    for (const [key, gRole] of member.guild.roles) {
      if (key === role.id) {
        member.roles.add(gRole)
      }
    }
  }
}
