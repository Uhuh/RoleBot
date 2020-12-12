import { Message, TextChannel } from 'discord.js';
import RoleBot from '../../../src/bot';
import { rolesByFolderId } from '../../../src/setup_table';

export default {
  desc:
    'Update a messages reactions. \nUpdate with roles in a folder by passing the folder id. \nEG: `rb reaction update 660203902193`',
  name: 'update',
  args: '<msg_id> [folder id]',
  type: 'reaction',
  run: async (message: Message, args: string[], client: RoleBot) => {
    if (!message.guild || !message.member!.hasPermission(['MANAGE_ROLES'])) {
      message.react('❌');
      return;
    }
    const GUILD_ID = message.guild.id;

    if (!args.length) return;

    const MSG_ID = args.shift();

    if (!MSG_ID) {
      message.channel.send('No message id given. :(');
      return;
    }

    if (!client.reactMessage.includes(MSG_ID)) {
      message.channel.send(
        "The message you want updated doesn't seem to have been used for roles before."
      );
      return;
    }

    let MSG: void | Message = {} as Message;

    for (const [, c] of message.guild.channels.cache) {
      if (c instanceof TextChannel) {
        MSG = await c.messages.fetch(MSG_ID).catch(() => {});
        if (MSG) break;
      }
    }

    if (!MSG) {
      message.channel.send(
        `Could not find that message. Make sure you copied the right id.`
      );
      return;
    }

    if (args.length) {
      const FOLDERS = client.guildFolders.get(GUILD_ID);
      if (!FOLDERS) {
        message.channel.send('No folders to add to.');
        return;
      }

      const FOLDER_ID = Number(args[0]);
      if (
        Number.isNaN(FOLDER_ID) ||
        FOLDER_ID < 0 ||
        FOLDER_ID >= FOLDERS.length
      ) {
        message.channel.send(
          'Incorrect folder ID given. Try running `rb folder -list`'
        );
        return;
      }

      const folder = client.folderContents.get(FOLDERS[FOLDER_ID].id);

      if (!folder) throw new Error('Folder not found, cannot add roles');

      if (!folder.roles.length) {
        message.channel.send(
          `\`${folder.label}\` has no roles. Make sure you sent the right ID.`
        );
        return;
      }

      MSG.reactions.removeAll();

      for (const role of folder.roles) {
        MSG.react(role.emoji_id).catch(() => {});
      }

      return;
    }

    const FOLDERLESS_ROLES = rolesByFolderId(GUILD_ID, null);

    MSG.reactions.removeAll();

    if (!FOLDERLESS_ROLES.length) {
      message.channel.send(
        'There are no free roles, add some or check for folders with roles.'
      );
      return;
    }

    for (const role of FOLDERLESS_ROLES) {
      MSG.react(role.emoji_id).catch(() => {});
    }

    message.react('✅');
  },
};
