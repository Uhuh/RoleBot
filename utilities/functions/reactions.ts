import { Message } from 'discord.js';
import { CREATE_REACT_MESSAGE } from '../../src/database/database';
import { ReactRole } from '../../src/database/entities';
import { LogService } from '../../src/services/logService';

export const reactToMessage = (
  message: Message,
  categoryRoles: ReactRole[],
  channelId: string,
  categoryId: number,
  isCustomMessage: boolean,
  log: LogService
) => {
  categoryRoles.map((r) => {
    message
      .react(r.emojiId.length > 3 ? `n:${r.emojiId}` : r.emojiId)
      .then(() => {
        CREATE_REACT_MESSAGE({
          messageId: message.id,
          emojiId: r.emojiId,
          roleId: r.roleId,
          guildId: message.guildId ?? '',
          categoryId: categoryId,
          isCustomMessage,
          channelId,
        });
      })
      .catch((e) => {
        log.error(
          `Failed to react to message[${message.id}] for guild[${message.guildId}]`
        );
        log.error(`${e}`);
      });
  });
};
