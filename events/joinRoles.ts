import { GuildMember, Collection } from "discord.js"

export default (member: GuildMember, joinRoles: Collection<string, {id: string, name: string}[]>) => {
  for (const role of joinRoles.get(member.guild.id) || []) {
    if (member.guild.roles.fetch(role.id)) {
      member.roles.add(role.id);
    }
  }
}
