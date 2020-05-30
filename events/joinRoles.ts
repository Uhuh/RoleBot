import { GuildMember, Collection } from "discord.js"
import { IJoinRole } from "../src/interfaces";

export default (member: GuildMember, joinRoles: Collection<string, Partial<IJoinRole>[]>) => {
  for (const role of joinRoles.get(member.guild.id) || []) {
    if (member.guild.roles.fetch(role.role_id) && role.role_id) {
      member.roles.add(role.role_id);
    }
  }
}
