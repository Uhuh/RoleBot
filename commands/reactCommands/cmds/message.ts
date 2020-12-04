import { Message, TextChannel } from 'discord.js';
import { addReactMessage, rolesByFolderId } from '../../../src/setup_table';
import RoleBot from '../../../src/bot';

export default {
  desc:
    'Will watch a custom message for reactions.\nUse roles in a folder by passing the folder id after the message id.',
  name: 'msg',
  args: '<message id> [Folder id]',
  type: 'reaction',
  run: async (message: Message, args: string[], client: RoleBot) => {
    if (!message.guild) return;

    if (!message.member!.hasPermission(['MANAGE_ROLES']))
      return message.react('❌');

    if (args.length === 0) return message.channel.send('No message id given.');

    const { guild } = message;
    const M_ID = args.shift();

    if (!M_ID) throw new Error('No M_ID given. >:(');

    let folder: { id: number; label: string } | undefined = undefined;

    if (args.length) {
      const GUILD_FOLDERS = client.guildFolders.get(guild.id);

      if (!GUILD_FOLDERS || !GUILD_FOLDERS.length)
        return message.channel.send("The server doesn't have any folders.");

      const ARRAY_ID = Number(args[0]);
      if (
        Number.isNaN(ARRAY_ID) ||
        ARRAY_ID < 0 ||
        ARRAY_ID >= GUILD_FOLDERS.length
      ) {
        return message.channel.send(
          'Incorrect folder ID given. Try running `rb folder list`'
        );
      }

      folder = GUILD_FOLDERS![ARRAY_ID];

      if (!folder)
        return message.channel.send(`Folder \`${ARRAY_ID}\` not found.`);
    }

    for (const [, ch] of guild.channels.cache) {
      if (ch instanceof TextChannel) {
        const msg = await ch.messages.fetch(M_ID).catch(() => {}); // Silently fail, it probably doesn't exist on the channel.

        if (!msg) continue;

        const { id } = folder || { id: null };
        const REACT_ROLES = rolesByFolderId(guild.id, id);

        REACT_ROLES.forEach((r) => {
          msg.react(r.emoji_id).catch(() => {}); // silently fail
        });

        addReactMessage(msg.id, ch.id, guild.id);
        client.reactMessage.push(msg.id);

        break;
      }
    }

    return message.react('✅');
  },
};
