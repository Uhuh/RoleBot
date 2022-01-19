import { Message } from 'discord.js';
import RoleBot from '../../src/bot';
import {
  CREATE_REACT_MESSAGE,
  DELETE_REACT_MESSAGES_BY_MESSAGE_ID,
  GET_CATEGORY_BY_ID,
  GET_REACT_MESSAGE_BY_CATEGORY_ID,
  GET_ROLES_BY_CATEGORY_ID,
} from '../../src/database/database';
import { ReactRole } from '../../src/database/entities';
import { EmbedService } from '../../src/services/embedService';
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
      .react(r.emojiId.length > 15 ? `n:${r.emojiId}` : r.emojiId)
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

export enum ReactMessageUpdate {
  categoryEdit,
  reactRoleRemove,
}

export const updateReactMessages = async (
  client: RoleBot,
  categoryId: number,
  log: LogService,
  type: ReactMessageUpdate
) => {
  try {
    const reactMessage = await GET_REACT_MESSAGE_BY_CATEGORY_ID(categoryId);

    if (!reactMessage) {
      return log.debug(`No react messages exist with category[${categoryId}]`);
    }

    const guild = await client.guilds.fetch(reactMessage.guildId);
    const channel = await guild.channels.fetch(reactMessage.channelId);

    if (!channel?.isText()) {
      return log.debug(
        `Guild[${reactMessage.guildId}] apparently does not have channel[${reactMessage.channelId}]`
      );
    }

    const message = await channel.messages.fetch(reactMessage.messageId);

    if (!message) {
      return log.debug(
        `Could not find message[${reactMessage.messageId}] in channel[${reactMessage.channelId}] in guild[${reactMessage.guildId}]`
      );
    }

    const categoryRoles = await GET_ROLES_BY_CATEGORY_ID(categoryId);
    const category = await GET_CATEGORY_BY_ID(reactMessage.categoryId);

    if (!category) {
      return log.critical(
        `Category[${reactMessage.categoryId}] does not exist in guild[${guild.id}]`
      );
    }

    const embed = EmbedService.reactRoleEmbed(categoryRoles, category);

    /**
     * The /react-message command allows users to use their own message instead of RoleBots
     * Make sure this is not their message. We cannot edit user messages.
     */
    if (!reactMessage.isCustomMessage) {
      await message
        .edit({
          embeds: [embed],
        })
        .catch(() =>
          log.error(
            `Failed to edit message[${reactMessage.messageId}] with updated react role embed in guild[${guild.id}]`
          )
        );
    }

    // If we're removing a role this matters. Otherwise we're only updating the embed for the category title/description
    if (type === ReactMessageUpdate.reactRoleRemove) {
      // Remove all react messages since they are created and depend on RoleBots reactions
      await DELETE_REACT_MESSAGES_BY_MESSAGE_ID(reactMessage.messageId);

      // Clear all reactions to remove and old incorrect reactions.
      await message.reactions.removeAll();

      // Re-react to the message with the updated react role list.
      reactToMessage(
        message,
        categoryRoles,
        channel.id,
        reactMessage.categoryId,
        reactMessage.isCustomMessage,
        log
      );
    }
  } catch (e) {
    log.error(`Caught an error updating reaction messages.`);
    log.error(`${e}`);
  }
};
