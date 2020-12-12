import { Message } from 'discord.js';
import { renameFolder } from '../../../src/setup_table';
import RoleBot from '../../../src/bot';

export default {
  desc: 'Want to change a folder name? Use this command.',
  name: 'rename',
  args: '<Old Name> | <New Name>',
  type: 'folder',
  run: (message: Message, args: string[], client: RoleBot) => {
    if (
      !message.guild ||
      !message.member!.hasPermission(['MANAGE_ROLES'] || !client.guildFolders)
    ) {
      message.react('❌');
      return;
    }
    const GUILD_ID = message.guild.id;

    const [oldName, newName] = args
      .join(' ')
      .split('|')
      .map((n) => n.trim());

    if (!newName || newName === '') {
      return message.reply(`the new folder name can't be empty!`);
    }

    const folder = client.guildFolders
      .get(GUILD_ID)
      ?.find((f) => f.label.toLowerCase() === oldName.toLowerCase());

    if (!folder) {
      return message.reply(`I couldn't find a folder with that name.`);
    }
    folder.label = newName;
    renameFolder(GUILD_ID, folder.id, newName);

    return message.reply(
      `successfully updated the folder name to \`${newName}\``
    );
  },
};
