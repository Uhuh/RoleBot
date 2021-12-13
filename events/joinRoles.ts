import { GuildMember, Collection } from 'discord.js';
import { LogService } from '../src/services/logService';

export default async (
  member: GuildMember,
  joinRoles: Collection<string, string[]>
) => {
  for (const role of joinRoles.get(member.guild.id) || []) {
    await member.guild.roles.fetch(role);
    const joinRole = member.guild.roles.cache.get(role || '');
    if (joinRole) {
      member.roles
        .add(joinRole)
        .catch(() =>
          LogService.error(
            `Issue giving user[${member.id}] auto-join role[${joinRole.id}]`
          )
        );
    }
  }
};
