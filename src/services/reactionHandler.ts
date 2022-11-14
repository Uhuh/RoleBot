import {
  Guild,
  GuildMember,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  User,
} from 'discord.js';

import { ReactMessage } from '../database/entities';
import { GET_CATEGORY_BY_ID } from '../database/queries/category.query';
import { GET_REACT_MESSAGE_BY_MSGID_AND_EMOJI_ID } from '../database/queries/reactMessage.query';
import { GET_REACT_ROLES_BY_CATEGORY_ID } from '../database/queries/reactRole.query';
import { LogService } from './logService';

export class ReactionHandler {
  private log: LogService;
  constructor() {
    this.log = new LogService('ReactionHandler');
  }

  handleReaction = async (
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
    type: 'add' | 'remove'
  ) => {
    if (!reaction || user.bot) return;
    const { message, emoji } = reaction;
    const { guild } = message;

    if (!guild) return;

    const emojiId = emoji.id || emoji.name;

    if (!emojiId) {
      return this.log.debug(
        `Emoji doesn't exist on message[${message.id}] reaction`,
        guild.id
      );
    }

    const reactMessage = await GET_REACT_MESSAGE_BY_MSGID_AND_EMOJI_ID(
      message.id,
      emojiId
    ).catch((e) =>
      this.log.error(`Failed to query for react message.\n${e}`, guild.id)
    );

    if (!reactMessage) return;

    if (!reactMessage.categoryId) {
      return this.log.error(
        `React role[${reactMessage.id}] in guild[${guild.id}] does NOT have a category set.`,
        guild.id
      );
    }

    const member = await guild.members
      .fetch(user.id)
      .catch((e) =>
        this.log.error(
          `Fetching user[${user.id}] threw an error.\n${e}`,
          guild.id
        )
      );

    if (!member) {
      return this.log.debug(
        `Failed to fetch member with user[${user.id}] for reaction[${type}]`,
        guild.id
      );
    }

    const category = await GET_CATEGORY_BY_ID(reactMessage.categoryId);

    if (!category) {
      return this.log.error(
        `Category[${reactMessage.categoryId}] does not exist`,
        guild.id
      );
    }

    // If the category limits who can react and the user doesn't have said role ignore request.
    if (
      category.requiredRoleId &&
      !member.roles.cache.has(category.requiredRoleId)
    ) {
      // Remove reaction as to not confuse the user that they succeeded.
      return reaction.users
        .remove(member)
        .catch(() => this.log.debug(`Failed to remove reaction`));
    }

    // If the category has an excluded role, and the user has said excluded role, ignore request.
    if (
      category.excludedRoleId &&
      member.roles.cache.has(category.excludedRoleId)
    ) {
      return reaction.users
        .remove(member)
        .catch(() => this.log.debug(`Failed to remove reaction`));
    }

    if (category.mutuallyExclusive) {
      return this.mutuallyExclusive(reactMessage, member, guild, type);
    }

    switch (type) {
      case 'add':
        member.roles
          .add(reactMessage.roleId)
          .catch((e) =>
            this.log.debug(
              `Cannot give role[${reactMessage.roleId}] to user[${member?.id}]\n${e}`,
              guild.id
            )
          );
        break;
      case 'remove':
        member.roles
          .remove(reactMessage.roleId)
          .catch((e) =>
            this.log.debug(
              `Cannot remove role[${reactMessage.roleId}] from user[${member?.id}]\n${e}`,
              guild.id
            )
          );
    }
  };

  /**
   * Handle categories mutually exclusive role management
   * @param reactMessage ReactRole info related to the react message
   * @param member Member whos roles we want to update
   * @param guild Guild that has roles we need to fetch
   * @param type Are we adding or removing a role
   */
  mutuallyExclusive = async (
    reactMessage: ReactMessage,
    member: GuildMember,
    guild: Guild,
    type: 'add' | 'remove'
  ) => {
    if (type === 'remove') {
      return member.roles
        .remove(reactMessage.roleId)
        .catch((e) =>
          this.log.error(
            `Failed to remove role[${reactMessage.roleId}] from user[${member.id}]\n${e}`,
            guild.id
          )
        );
    }

    if (!reactMessage.categoryId) {
      return this.log.error(
        `React role[${reactMessage.id}] category is undefined.`,
        guild.id
      );
    }

    const categoryRoles = (
      await GET_REACT_ROLES_BY_CATEGORY_ID(reactMessage.categoryId)
    ).map((r) => r.roleId);

    /**
     * This is to filter out any react roles in the same category since it's mutually exclusive.
     * However, to edit the member we need all the OTHER roles even non RoleBot related.
     */
    const updatedRoleList = member.roles.cache.filter(
      (r) => r.id === reactMessage.roleId || !categoryRoles.includes(r.id)
    );

    // Fetch the role we want to ADD to the user.
    const role = await guild.roles
      .fetch(reactMessage.roleId)
      .catch((e) =>
        this.log.error(
          `Failed to fetch role[${reactMessage.roleId}]\n${e}`,
          guild.id
        )
      );

    if (!role) {
      return this.log.debug(
        `Role[${reactMessage.roleId}] could not be found`,
        guild.id
      );
    }

    // Because this is the role we want to give the user we need to set it.
    updatedRoleList.set(role.id, role);

    member
      .edit({
        roles: updatedRoleList,
      })
      .catch((e) =>
        this.log.error(`Failed to update members roles.\n${e}`, guild.id)
      );
  };
}
