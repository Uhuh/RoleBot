import { Message, MessageEmbed, TextChannel } from 'discord.js';
import RoleBot from '../../../src/bot';
import { rolesByFolderId } from '../../../src/setup_table';
import { IFolderReactEmoji, IRoleEmoji } from '../../../src/interfaces';

export default {
  desc: 'All emojis associated with a role',
  name: 'list',
  args: '',
  type: 'reaction',
  run: (
    message: Message,
    roleChannel: any,
    folder: IFolderReactEmoji | null | RoleBot,
    client?: RoleBot
  ) => {
    if (!message.guild) return;

    // This is true if the user wanted the list.
    // If they did call it they probably want role id's.
    const USER_CALLED = folder instanceof RoleBot;
    const { guild } = message;
    //@ts-ignore
    let { roles } = folder || { roles: [] };

    if (folder instanceof RoleBot) {
      const folders = folder.guildFolders.get(guild.id);
      roles = rolesByFolderId(message.guild.id, null);

      message.channel.send(
        generateEmbed('Server Roles', roles, USER_CALLED, folder)
      );

      if (!folders) return;

      folders.forEach((f) => {
        const contents = folder.folderContents.get(f.id);

        if (!contents) throw new Error('Folder contents DNE');

        const R = contents.roles;

        if (!R.length) return;

        message.channel.send(generateEmbed(f.label, R, USER_CALLED, folder));
      });

      return;
    } else if (!folder) {
      roles = rolesByFolderId(message.guild.id, null);
    }

    if (roleChannel instanceof TextChannel)
      return roleChannel.send(
        generateEmbed(folder!.label, roles, USER_CALLED, client)
      );

    return message.channel.send(
      generateEmbed(folder!.label, roles, USER_CALLED, client)
    );
  },
};

const generateEmbed = (
  label: string,
  roles: IRoleEmoji[],
  USER_CALLED: boolean,
  client?: RoleBot
): MessageEmbed => {
  const embed = new MessageEmbed();

  embed.setTitle(`**${label}**`);
  embed.setColor('#cffc03');

  if (roles.length) {
    let desc = '';
    for (const r in roles) {
      let emoji = client?.emojis.cache.get(roles[r].emoji_id);
      if (!emoji) {
        //@ts-ignore
        emoji = client?.emojis.resolve(roles[r].emoji_id);
      }
      desc += `${USER_CALLED ? `[ ID ${r} ] - ` : ''}${
        emoji || roles[r].emoji_id
      } - <@&${roles[r].role_id}>\n`;
    }

    embed.setDescription(desc);
  } else embed.setDescription(`There are no reaction roles`);

  return embed;
};
