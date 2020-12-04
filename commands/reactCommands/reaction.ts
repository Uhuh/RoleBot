import { Message, MessageEmbed } from 'discord.js';
import RoleBot from '../../src/bot';
import AddRole from './cmds/add';
import RoleChannel from './cmds/channel';
import RoleList from './cmds/list';
import RoleMessage from './cmds/message';
import RoleMove from './cmds/move';
import RoleRemove from './cmds/remove';
import RoleSwap from './cmds/swap';
import RoleUpdate from './cmds/update';

const funcs = [
  AddRole,
  RoleChannel,
  RoleList,
  RoleMessage,
  RoleMove,
  RoleRemove,
  RoleSwap,
  RoleUpdate,
];

export default {
  desc: 'Reaction command handler, does not get seen by users',
  name: 'reaction',
  args: '<reaction command> <its args>',
  type: 'reaction-handler',
  run: (message: Message, args: string[], client: RoleBot) => {
    if (!args.length) {
      return message.reply(
        `you need to pass a reaction command. Check out \`rb help reaction\` for the commands.`
      );
    }

    switch (args.shift()!.toLowerCase()) {
      case 'help':
        const embed = new MessageEmbed();
        embed
          .setTitle('**React Role commands**')
          .setColor(16711684)
          .setAuthor(client.user?.username, client.user?.avatarURL() || '')
          .setThumbnail(client.user?.avatarURL() || '')
          .setFooter(`Replying to: ${message.author.tag}`)
          .setTimestamp(new Date());

        for (const func of funcs) {
          embed.addField(
            `**rb reaction ${func.name} ${func.args}**`,
            func.desc
          );
        }

        message.channel.send(embed);
        break;
      case 'add':
        AddRole.run(message, args, client);
        break;
      case 'channel':
        RoleChannel.run(message, args, client);
        break;
      case 'list':
        /**
         * This command is used by the channel command to display roles in the given
         * channel. Otherwise it only needs the message object to work for users.
         */
        RoleList.run(message, null, client);
        break;
      case 'message':
        RoleMessage.run(message, args, client);
        break;
      case 'move':
        RoleMove.run(message, args, client);
        break;
      case 'remove':
        RoleRemove.run(message, args, client);
        break;
      case 'swap':
        RoleSwap.run(message, args, client);
        break;
      case 'update':
        RoleUpdate.run(message, args, client);
        break;
      default:
        message.reply(`that's not a valid reaction command.`);
    }
    return;
  },
};
