import { Message } from 'discord.js';
import { reactionById, giveFolderId } from '../../../src/setup_table';
import RoleBot from '../../../src/bot';

export default {
  desc:
    "Move a single role into a folder or remove it from a folder.\nExample `rb reaction move Xbox` will remove `Xbox` from any folder it's in.",
  name: 'move',
  args: '<Name> | [Folder id]',
  type: 'reaction',
  run: (message: Message, args: string[], client: RoleBot) => {
    if (!message.guild || !message.member!.hasPermission(['MANAGE_ROLES']))
      return;

    const [roleName, folderId] = args
      .join(' ')
      .split('|')
      .map((l) => l.trim().toLowerCase());

    if (!roleName) {
      return message.channel.send('No role given! Try `rb reaction move Blue`');
    }

    const role = message.guild.roles.cache.find(
      (r) => r.name.toLowerCase() === roleName.toLowerCase()
    );

    if (!role) {
      return message.channel.send(
        `Could not find \`${roleName}\`. Check for typos!`
      );
    }

    const reactionRole = reactionById(role.id);

    if (reactionRole.folder_id === folderId) {
      return message.channel.send(
        `Didn't move role as you gave it the the same spot to move to.`
      );
    } else {
      const GUILD_FOLDERS = client.guildFolders.get(message.guild.id);

      if (!GUILD_FOLDERS || !GUILD_FOLDERS.length)
        return message.channel.send("The server doesn't have any folders.");

      const ARRAY_ID = Number(folderId);
      if (
        folderId &&
        (Number.isNaN(ARRAY_ID) ||
          ARRAY_ID < 0 ||
          ARRAY_ID >= GUILD_FOLDERS.length)
      ) {
        return message.channel.send(
          'Incorrect folder ID given. Try running `rb folder list` to see folders with their IDs.'
        );
      }

      const currFolder = client.folderContents.get(
        Number(reactionRole.folder_id)
      );
      const nextFolderId = folderId ? GUILD_FOLDERS[Number(folderId)].id : null;
      const nextFolder = client.folderContents.get(nextFolderId || -1);

      if (currFolder) {
        const r = currFolder.roles.find(
          (fr) => fr.role_id === reactionRole.role_id
        );
        if (!r) {
          return message.channel.send(
            `I can't seem to find that role anywhere...`
          );
        }
        currFolder.roles.splice(currFolder.roles.indexOf(r), 1);
      }
      if (nextFolder) {
        nextFolder.roles = [
          ...nextFolder.roles,
          {
            emoji_id: reactionRole.emoji_id,
            role_id: reactionRole.role_id,
            role_name: reactionRole.role_name,
          },
        ];
      }

      giveFolderId(reactionRole.role_id, nextFolder ? nextFolder.id : null);
    }

    return message.react('✅');
  },
};
