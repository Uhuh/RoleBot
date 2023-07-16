import {
  APIRole,
  ChannelType,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Interaction,
  Message,
  Role,
  StringSelectMenuInteraction,
  CommandInteraction,
} from 'discord.js';
import { ReactRole } from '../src/database/entities';
import { DisplayType } from '../src/database/entities/category.entity';
import { GuildReactType } from '../src/database/entities/guild.entity';
import {
  GET_CATEGORY_BY_ID,
  GET_ROLES_BY_CATEGORY_ID,
} from '../src/database/queries/category.query';
import {
  CREATE_REACT_MESSAGE,
  DELETE_REACT_MESSAGES_BY_MESSAGE_ID,
  GET_REACT_MESSAGE_BY_CATEGORY_ID,
} from '../src/database/queries/reactMessage.query';
import { EmbedService } from '../src/services/embedService';
import { LogService } from '../src/services/logService';
import { CLIENT_ID } from '../src/vars';

export const reactToMessage = async (
  message: Message,
  guildId: string,
  categoryRoles: ReactRole[],
  channelId: string,
  categoryId: number,
  isCustomMessage: boolean,
  log: LogService
) => {
  for (const role of categoryRoles) {
    try {
      await message.react(role.emojiId);

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
        }] in guild[${guildId}]\n${e}`
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
  type: ReactMessageUpdate
) => {
  try {
    const reactMessage = await GET_REACT_MESSAGE_BY_CATEGORY_ID(categoryId);

    if (!reactMessage) {
      return log.debug(`No react messages exist with category[${categoryId}]`);
    }

    const { guildId, channelId, messageId } = reactMessage;

    const channel = await interaction.guild?.channels
      .fetch(channelId)
      .catch(() => log.info(`Failed to fetch channel[${channelId}]`, guildId));

    if (!(channel?.type === ChannelType.GuildText)) {
      return log.debug(
        `Guild[${guildId}] apparently does not have channel[${channelId}]`
      );
    }

    const message = await channel.messages
      .fetch(messageId)
      .catch(() => log.info(`Failed to fetch message[${messageId}]`, guildId));

    if (!message) {
      return log.debug(
        `Could not find message[${messageId}] in channel[${channelId}] in guild[${guildId}]`
      );
    }

    const category = await GET_CATEGORY_BY_ID(categoryId);

    if (!category) {
      return log.critical(
        `Category[${categoryId}] does not exist in guild[${guildId}]`
      );
    }

    const categoryRoles = await GET_ROLES_BY_CATEGORY_ID(
      categoryId,
      category.displayOrder
    );
    const embed = EmbedService.reactRoleEmbed(categoryRoles, category);

    /**
     * The /react message command allows users to use their own message instead of RoleBots
     * Make sure this is not their message. We cannot edit user messages.
     */
    if (!reactMessage.isCustomMessage) {
      await message
        .edit({
          embeds: [embed],
        })
        .catch(() =>
          log.error(
            `Failed to edit message[${messageId}] with updated react role embed in guild[${guildId}]`
          )
        );
    }

    // If we're removing a role this matters. Otherwise we're only updating the embed for the category title/description
    if (type === ReactMessageUpdate.reactRoleRemove) {
      /**
       * Clear all reactions first. If RoleBot is missing permission then we don't want to delete react message by ID.
       */
      await message.reactions.removeAll();

      // Remove all react messages since they are created and depend on RoleBots reactions
      await DELETE_REACT_MESSAGES_BY_MESSAGE_ID(messageId);

      // Re-react to the message with the updated react role list.
      await reactToMessage(
        message,
        guildId,
        categoryRoles,
        channel.id,
        categoryId,
        reactMessage.isCustomMessage,
        log
      );
    }
  } catch (e) {
    log.error(
      `Caught an error updating reaction messages.\n${e}`,
      interaction.guildId
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
  chunkSize: number
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
    | StringSelectMenuInteraction,
  content: { content: string; ephemeral?: boolean } | string
) => {
  interaction.reply(content).catch((interactionError) => {
    interaction.channel
      ?.send(typeof content === 'string' ? content : content.content)
      .catch((channelError) =>
        logger.error(
          `Failed to reply to interaction and failed to send channel message.\n\t\t\t${interactionError}\n\t\t\t${channelError}`
        )
      );
  });
};

/**
 * Check that RoleBot has a role above the one the user wants to hand out.
 * @returns true if the bot has a role above the users role.
 */
export async function isValidRolePosition(
  interaction: Interaction,
  role: Role | APIRole
) {
  const clientUser = await interaction.guild?.members
    .fetch(CLIENT_ID)
    .catch(() => console.log(`Failed to fetch client user for guild.`));

  if (!clientUser) return false;

  return clientUser.roles.highest.position > role.position;
}

interface IDisplayOptions {
  name: string;
  value: keyof typeof DisplayType;
}

export function getDisplayCommandValues(): IDisplayOptions[] {
  return [
    { name: 'Alphabetical', value: 'alpha' },
    { name: 'Reverse alphabetical', value: 'reversedAlpha' },
    { name: 'Insertion order', value: 'time' },
    { name: 'Reverse insertion', value: 'reversedTime' },
  ];
}

export function parseDisplayString(
  display: keyof typeof DisplayType | null
): DisplayType {
  return DisplayType[display ?? 'alpha'];
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
  reactType: keyof typeof GuildReactType | null
): GuildReactType {
  return GuildReactType[reactType ?? 'reaction'];
}
