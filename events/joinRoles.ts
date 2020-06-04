import { GuildMember, Collection } from "discord.js"
import { IJoinRole } from "../src/interfaces";

export default async (member: GuildMember, joinRoles: Collection<string, Partial<IJoinRole>[]>) => {
  for (const role of joinRoles.get(member.guild.id) || []) {
    await member.guild.roles.fetch(role.role_id);
    const joinRole = member.guild.roles.cache.get(role.role_id || '');
    if (joinRole) {
      member.roles.add(joinRole).catch(console.error);
    }
  }
}
