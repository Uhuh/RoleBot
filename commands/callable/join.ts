import { Message } from 'discord.js';
import { getJoinRoles, joinRoles } from '../../src/setup_table';
import RoleBot from '../../src/bot';

export default {
  desc: 'Users are given this role upon joining.\n' + 'E.G: `rb join Member`',
  name: 'join',
  args: '',
  type: 'message',
  run: (message: Message, args: string[], client: RoleBot) => {
    // ignore them plebians
    if (!message.guild || !message.member!.hasPermission(['MANAGE_ROLES']))
      return;

    const roleName = args.join(' ');

    const role = message.guild.roles.cache.find(
      (r) => r.name.toLowerCase() === roleName.toLowerCase()
    );
    const guildJRoles = getJoinRoles(message.guild.id);

    if (role) {
      message.react('✅');
      client.joinRoles.set(message.guild.id, [
        ...guildJRoles,
        { role_id: role.id, role_name: role.name },
      ]);
      return joinRoles.run({
        id: `${message.guild.id}-${role.id}`,
        role_name: role.name,
        role_id: role.id,
        guild_id: message.guild.id,
      });
    } else {
      message.reply(
        `I couldn't find that role with that name, make sure it's correct.`
      );
    }

    return message.react('❌');
  },
};
