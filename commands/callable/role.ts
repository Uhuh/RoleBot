import { Message } from 'discord.js';
import RoleBot from '../../src/bot';

export default {
  desc: 'Give either all humans or all bots a role.',
  name: 'role',
  args: '<humans | bots> <@role>',
  type: 'general',
  run: async (message: Message, args: string[], client: RoleBot) => {
    if (
      !message.guild ||
      !message.member?.hasPermission(['MANAGE_ROLES']) ||
      args.length === 0
    )
      return;

    const type = args.shift();

    if (!type) {
      return message.reply(
        `you need to pass a type. Either \`humans\` or \`bots\``
      );
    }

    const role = message.mentions.roles.first();

    if (!role) {
      return message.reply(
        `you need to @ a role that you want given to everyone.`
      );
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
        `the role you're trying to give out is higher in the role hierarchy so I can't give it out. Put it below my role or give me a role that's above it.`
      );
    }

    switch (type.toLowerCase()) {
      case 'humans':
        const users = message.guild.members.cache.filter((m) => !m.user.bot);
        for (const [, m] of users) {
          m.roles.add(role);
        }
        break;
      case 'bots':
        const bots = message.guild.members.cache.filter((m) => m.user.bot);
        for (const [, m] of bots) {
          m.roles.add(role);
        }
        break;
      default:
        message.reply(
          `that's not a type. Please use either \`humans\` or \`bots\`.`
        );
    }

    return;
  },
};
