import { Message, MessageEmbed } from 'discord.js';
import { getJoinRoles, joinRoles } from '../../src/setup_table';
import RoleBot from '../../src/bot';
import { deleteJoin } from '../../src/setup_table';

export default {
  desc:
    'Users are given this role upon joining.\n' + 'E.G: `rb join add Member`',
  name: 'join',
  args: '<add | remove | list> <Role name | Role ID>',
  type: 'general',
  run: (message: Message, args: string[], client: RoleBot) => {
    if (
      !message.guild ||
      !message.member?.hasPermission(['MANAGE_GUILD']) ||
      args.length === 0
    )
      return;

    const guildId = message.guild.id;
    const command = args.shift()?.toLowerCase();
    const roleId = args.join(' ').toLowerCase();
    const guildJRoles = getJoinRoles(message.guild.id);

    switch (command) {
      case 'add':
      case 'remove':
        if (!roleId) {
          return message.reply(`you need to include the role name or ID.`);
        }

        const role = message.guild.roles.cache.find(
          (r) => r.id === roleId || r.name.toLowerCase() === roleId
        );

        if (!role) {
          return message.reply(`couldn't find a role with that name or ID`);
        }

        const clientMember = message.guild.members.cache.find(
          (m) => m.id === client.user?.id
        );

        if (!clientMember) {
          return console.error(
            `Join command - I don't know why the client member was unfindable.`
          );
        }

        if (
          role.position >
          Math.max(...clientMember.roles.cache.map((r) => r.position))
        ) {
          return message.reply(
            `the role you're trying to add is higher in the role hierarchy so I can't give it out. Put it below my role or give me a role that's above it.`
          );
        }

        if (command === 'add') {
          client.joinRoles.set(guildId, [
            ...guildJRoles,
            { role_id: role.id, role_name: role.name },
          ]);
          joinRoles.run({
            id: `${message.guild.id}-${role.id}`,
            role_name: role.name,
            role_id: role.id,
            guild_id: message.guild.id,
          });
          return message.reply(`successfully added the role to the join list.`);
        } else {
          deleteJoin.run(guildId, role.id);
          client.joinRoles.set(guildId, [
            ...guildJRoles.filter((r) => r.role_id !== role.id),
          ]);
          message.reply(`successfully removed the role from the join list.`);
        }
        break;
      case 'list':
        if (!guildJRoles) {
          return message.reply(`no join roles!`);
        }
        const embed = new MessageEmbed();
        embed
          .setTitle(`Roles users get when joining`)
          .setColor(16580705)
          .setDescription(
            `${
              !guildJRoles?.length
                ? 'No join roles!'
                : guildJRoles.map((r) => `<@&${r.role_id}>`).join('\n')
            }`
          );

        message.channel.send(embed);
        break;
    }

    return;
  },
};
