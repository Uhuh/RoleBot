import {
  APIRole,
  ButtonInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  CommandInteraction,
  Interaction,
  Message, MessageFlags,
  Role,
  SelectMenuInteraction,
} from 'discord.js';
import { ReactRole } from '../src/database/entities';
import { DisplayType, ImageType } from '../src/database/entities/category.entity';
import { GuildReactType } from '../src/database/entities/guild.entity';
import { GET_CATEGORY_BY_ID, GET_ROLES_BY_CATEGORY_ID } from '../src/database/queries/category.query';
import {
  CREATE_REACT_MESSAGE,
  DELETE_REACT_MESSAGES_BY_MESSAGE_ID,
  GET_GUILD_REACT_MESSAGE_BY_CATEGORY_ID,
} from '../src/database/queries/reactMessage.query';
import { LogService } from '../src/services/logService';
import { CLIENT_ID } from '../src/vars';
import { reactRoleEmbed } from './utilEmbedHelpers';

export const reactToMessage = async (
  message: Message,
  guildId: string,
  categoryRoles: ReactRole[],
  channelId: string,
  categoryId: number,
  isCustomMessage: boolean,
  log: LogService,
) => {
  log.debug(`Creating react message for message[${message.id}] for ${categoryRoles.length} category roles.`, guildId);

  for (const role of categoryRoles) {
    try {
      await message.react(role.emojiId);

      log.debug(`Creating react message with emoji[${role.emojiId}], role[${role.roleId}] and category[${categoryId}]`, guildId);
      await CREATE_REACT_MESSAGE({
        messageId: message.id,
        emojiId: role.emojiId,
        roleId: role.roleId,
        guildId,
        categoryId: categoryId,
        isCustomMessage,
        channelId,
      });
    } catch (e) {
      log.debug(
        `Failed to react to message[${message.id}] with emoji[${
          role.emojiTag ?? role.emojiId
        }] in guild[${guildId}]\n${e}`,
      );

      return false;
    }
  }

  return true;
};

export enum ReactMessageUpdate {
  categoryEdit,
  reactRoleRemove,
}

export const updateReactMessages = async (
  interaction: CommandInteraction,
  categoryId: number,
  log: LogService,
  type: ReactMessageUpdate,
) => {
  try {
    const { guildId } = interaction;

    if (!guildId) {
      throw Error('GuildId was missing on interaction');
    }

    const reactMessage = await GET_GUILD_REACT_MESSAGE_BY_CATEGORY_ID(guildId, categoryId);

    if (!reactMessage) {
      return log.debug(`No react messages exist with category[${categoryId}]`);
    }

    /**
     * Sometimes servers fail to give RoleBot MANAGE_MESSAGE perms which affects RoleBot's ability to remove reactions.
     * Use this to alert the user that somewhere failed to update.
     */
    let failedToRemoveReactions = false;

    const { channelId, messageId, isCustomMessage } = reactMessage;

    const channel = await interaction.guild?.channels
      .fetch(channelId)
      .catch(() => log.info(`Failed to fetch channel[${channelId}]`, guildId));

    if (channel?.type !== ChannelType.GuildText) {
      return log.info(`Channel[${channelId}] is not of GuildText type.`, guildId);
    }

    const message = await channel.messages
      .fetch(messageId)
      .catch(() => log.info(`Failed to fetch message[${messageId}]`, guildId));

    if (!message) {
      return log.info(
        `Could not find message[${messageId}] in channel[${channelId}] in guild[${guildId}]`,
      );
    }

    const category = await GET_CATEGORY_BY_ID(categoryId);

    if (!category) {
      return log.critical(
        `Category[${categoryId}] does not exist in guild[${guildId}]`,
      );
    }

    const categoryRoles = await GET_ROLES_BY_CATEGORY_ID(
      categoryId,
      category.displayOrder,
    );

    const embed = reactRoleEmbed(categoryRoles, category);

    /**
     * The /react message command allows users to use their own message instead of RoleBots
     * Make sure this is not their message. We cannot edit user messages.
     */
    if (!isCustomMessage) {
      await message
        .edit({
          embeds: [embed],
        })
        .catch(() =>
          log.error(
            `Failed to edit message[${messageId}] with updated react role embed in guild[${guildId}]`,
          ),
        );
    }

    // If we're removing a role this matters. Otherwise we're only updating the embed for the category title/description
    if (type === ReactMessageUpdate.reactRoleRemove) {
      /**
       * Clear all reactions first. If RoleBot is missing permission then we don't want to delete react message by ID.
       */
      await message.reactions.removeAll().catch(() => {
        failedToRemoveReactions = true;
        log.error(`Failed to remove all reactions for message[${messageId}]`, guildId);
      });

      log.info(`Purging existing react messages by message id[${messageId}]`, guildId);
      await DELETE_REACT_MESSAGES_BY_MESSAGE_ID(messageId);

      log.info(`Reacting to message[${messageId}] for category[${categoryId}]`, guildId);
      await reactToMessage(
        message,
        guildId,
        categoryRoles,
        channel.id,
        categoryId,
        isCustomMessage,
        log,
      );
    }

    if (failedToRemoveReactions) {
      const messageLink = `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
      log.debug(`Informing user RoleBot failed to update the message properly.`, guildId);

      await interaction.followUp({
        content: `I failed to update the messages reactions. This is usually caused by not giving me "MANAGE_MESSAGE" permissions in a channel.\n\nThe message I tried updating: ${messageLink}`,
        flags: MessageFlags.Ephemeral
      });
    }
  } catch (e) {
    log.error(
      `Caught an error updating reaction messages.\n${e}`,
      interaction.guildId,
    );
  }
};

/**
 * Break up and existing array into multiple chunks.
 * @param arr - Anything we want to split up.
 * @param chunkSize - The size of the array chunks.
 * @returns Array of new chunks.
 */
export const spliceIntoChunks = <T>(
  arr: readonly T[],
  chunkSize: number,
): T[][] => {
  const result: T[][] = [];
  const arrCopy = [...arr];
  while (arrCopy.length > 0) result.push(arrCopy.splice(0, chunkSize));
  return result;
};

/**
 * Handle replying to the interaction and error handling if replies fail.
 * @param logger - Respective slash command log service
 * @param interaction - Interaction that was run
 * @param content - Content to reply to user with
 */
export const handleInteractionReply = (
  logger: LogService,
  interaction:
    | ChatInputCommandInteraction
    | ButtonInteraction
    | SelectMenuInteraction,
  content: { content: string; ephemeral?: boolean } | string,
) => {
  interaction
    .reply(content)
    .catch((interactionError) => {
      if (!interaction.channel || !('send' in interaction.channel)) {
        return;
      }

      interaction.channel
        .send(typeof content === 'string' ? content : content.content)
        .catch((channelError) =>
          logger.error(
            `Failed to reply to interaction and failed to send channel message.\n\t\t\t${interactionError}\n\t\t\t${channelError}`,
          ),
        );
    });
};

/**
 * Check that RoleBot has a role above the one the user wants to hand out.
 * @returns true if the bot has a role above the users role.
 */
export async function isValidRolePosition(
  interaction: Interaction,
  role: Role | APIRole,
) {
  const clientUser = await interaction.guild?.members
    .fetch(CLIENT_ID)
    .catch(() => console.log(`Failed to fetch client user for guild.`));

  if (!clientUser) return false;

  return clientUser.roles.highest.position > role.position;
}

interface IImageTypeChoice {
  name: string;
  value: ImageType;
}

export function getImageTypeCommandChoices(): IImageTypeChoice[] {
  return [
    { name: 'Large', value: 'card' },
    { name: 'Thumbnail', value: 'thumbnail' },
  ];
}

export function parseImageTypeString(imageType: string | null): ImageType | null {
  if (imageType !== 'card' && imageType !== 'thumbnail') {
    return null;
  }

  return imageType;
}

interface IDisplayChoice {
  name: string;
  value: keyof typeof DisplayType;
}

export function getDisplayCommandChoices(): IDisplayChoice[] {
  return [
    { name: 'Alphabetical', value: 'alpha' },
    { name: 'Reverse alphabetical', value: 'reversedAlpha' },
    { name: 'Insertion order', value: 'time' },
    { name: 'Reverse insertion', value: 'reversedTime' },
  ];
}

export function parseDisplayString(
  display: keyof typeof DisplayType | null,
): DisplayType | null {
  return display ? DisplayType[display ?? 'alpha'] : null;
}

export function displayOrderQuery(display?: DisplayType): {
  [k: string]: 'ASC' | 'DESC';
} {
  switch (display) {
    case DisplayType.alpha:
      return { name: 'ASC' };
    case DisplayType.reversedAlpha:
      return { name: 'DESC' };
    case DisplayType.time:
      return { categoryAddDate: 'ASC' };
    case DisplayType.reversedTime:
      return { categoryAddDate: 'DESC' };
    default:
      return { name: 'ASC' };
  }
}

interface IConfigOptions {
  name: string;
  value: keyof typeof GuildReactType;
}

export function getGuildReactConfigValues(): IConfigOptions[] {
  return [
    { name: 'Reaction', value: 'reaction' },
    { name: 'Button', value: 'button' },
  ];
}

export function parseGuildReactString(
  reactType: keyof typeof GuildReactType | null,
): GuildReactType {
  return GuildReactType[reactType ?? 'reaction'];
}
