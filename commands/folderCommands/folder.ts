import { Message, MessageEmbed } from 'discord.js';
import RoleBot from '../../src/bot';
import FolderAdd from './cmds/add';
import FolderList from './cmds/list';
import FolderNew from './cmds/new';
import FolderRemove from './cmds/remove';
import FolderReName from './cmds/rename';

const funcs = [FolderAdd, FolderList, FolderNew, FolderRemove, FolderReName];

export default {
  desc: 'Folder command handler, does not get seen by users',
  name: 'folder',
  args: '<folder command> <its args>',
  type: 'folder-handler',
  run: (message: Message, args: string[], client: RoleBot) => {
    if (!args.length) {
      return message.reply(
        `you need to pass a folder command. Check out \`rb help folder\` for the commands.`
      );
    }

    switch (args.shift()!.toLowerCase()) {
      case 'help':
        client.user?.username;
        const embed = new MessageEmbed();
        embed
          .setTitle('**Folder commands**')
          .setColor(16711684)
          .setAuthor(client.user?.username, client.user?.avatarURL() || '')
          .setThumbnail(client.user?.avatarURL() || '')
          .setFooter(`Replying to: ${message.author.tag}`)
          .setTimestamp(new Date());

        for (const func of funcs) {
          embed.addField(`**rb folder ${func.name} ${func.args}**`, func.desc);
        }

        message.channel.send(embed);
        break;
      case 'add':
        FolderAdd.run(message, args, client);
        break;
      case 'list':
        FolderList.run(message, args, client);
        break;
      case 'create':
        FolderNew.run(message, args, client);
        break;
      case 'remove':
        FolderRemove.run(message, args, client);
        break;
      case 'rename':
        FolderReName.run(message, args, client);
        break;
      default:
        message.reply(`that's not a valid folder command.`);
    }
    return;
  },
};
