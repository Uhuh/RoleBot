import { Message } from 'discord.js';
import {
  addReactionRole,
  getRoleByReaction,
  getRoleByName,
} from '../../../src/setup_table';
import RoleBot from '../../../src/bot';

export default {
  desc:
    'Associate an emoji with a role.\nExample `rb reaction add Member | :D`',
  name: 'add',
  args: '<Role name> | <Emoji>',
  type: 'reaction',
  run: (message: Message, args: string[], client: RoleBot) => {
    if (!message.guild || !message.member!.hasPermission(['MANAGE_ROLES']))
      return;

    const [roleName, emojiId] = args
      .join(' ')
      .split('|')
      .map((l) => l.trim());
    let emoji = emojiId;

    const role = message.guild.roles.cache.find(
      (r) =>
        r.id === roleName || r.name.toLowerCase() === roleName.toLowerCase()
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

    const react = getRoleByName(role.name, message.guild.id);
    if (react) {
      return message.channel.send(
        `Role \`${role.name}\` is already being used.`
      );
    }

    if (!emoji || emoji === '') {
      return message.channel.send(`You need to include an emoji.`);
    }

    const match = /:(\d+)>/.exec(emojiId);

    if (match) {
      const [, id] = match;
      if (!client.emojis.cache.get(id)) {
        return message.channel.send(`Couldn't find emoji ${emojiId}.`);
      }
      emoji = id;
    }
    const reaction = getRoleByReaction(emoji, message.guild.id);
    if (reaction) {
      return message.channel.send(
        `Emoji is already being used by \`${reaction.role_name}\``
      );
    }

    addReactionRole(emoji, role.id, role.name, message.guild.id);
    return message.react('✅');
  },
};
