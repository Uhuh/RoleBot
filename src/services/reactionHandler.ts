import {
  GuildMember,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  User,
} from 'discord.js';
import {
  GET_CATEGORY_BY_ID,
  GET_REACT_MSG,
  GET_REACT_ROLES_BY_CATEGORY_ID,
} from '../database/database';
import { IReactMessageDoc } from '../database/reactMessage';
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
        `Emoji doesn't exist on message[${message.id}] reaction for guild[${guild.id}].`
      );
    }

    const reactRole = await GET_REACT_MSG(message.id, emojiId);
    if (!reactRole) return;

    if (!reactRole.categoryId) {
      return this.log.error(
        `React role[${reactRole.id}] in guild[${guild.id}] does NOT have a category set.`
      );
    }

    const member = await guild.members
      .fetch(user.id)
      .catch(() => this.log.error(`Fetching user[${user.id}] threw an error.`));

    if (!member) {
      return this.log.debug(
        `Failed to fetch member with user[${user.id}] for reaction[${type}] on guild[${guild.id}]`
      );
    }

    const category = await GET_CATEGORY_BY_ID(reactRole.categoryId);

    if (!category) {
      return this.log.error(
        `Category[${reactRole.categoryId}] does not exist for guild[${guild.id}]`
      );
    }

    if (category.mutuallyExclusive) {
      return this.mutuallyExclusive(reactRole, member, type);
    }

    switch (type) {
      case 'add':
        member.roles
          .add(reactRole.roleId)
          .catch(() =>
            this.log.error(
              `Cannot give role[${reactRole.roleId}] to user[${member?.id}]`
            )
          );
        break;
      case 'remove':
        member.roles
          .remove(reactRole.roleId)
          .catch(() =>
            this.log.error(
              `Cannot remove role[${reactRole.roleId}] from user[${member?.id}]`
            )
          );
    }
  };

  mutuallyExclusive = async (
    reactRole: IReactMessageDoc,
    member: GuildMember,
    type: 'add' | 'remove'
  ) => {
    // If it's removing it's pretty simple.
    if (type === 'remove') {
      return member.roles
        .remove(reactRole.roleId)
        .catch(() =>
          this.log.debug(
            `Failed to remove role[${reactRole.roleId}] from user[${member.id}] because they unreacted.`
          )
        );
    }

    // If we're ADDING a role then we need to figure out what out one they had.

    if (!reactRole.categoryId) {
      return this.log.error(
        `React role[${reactRole.id}] category is undefined.`
      );
    }

    const categoryRoles = (
      await GET_REACT_ROLES_BY_CATEGORY_ID(reactRole.categoryId)
    ).map((r) => r.roleId);

    const rolesToRemove = member.roles.cache.filter(
      (r) => r.id !== reactRole.roleId && categoryRoles.includes(r.id)
    );

    member.roles
      .add(reactRole.roleId)
      .catch(() =>
        this.log.debug(
          `Could not add role[${reactRole.roleId}] to member[${member.id}] in guild[${member.guild.id}]`
        )
      );

    await new Promise((res) => setTimeout(() => res(`why`), 1000));

    member.roles
      .remove(rolesToRemove)
      .catch(() =>
        this.log.debug(
          `Could not remove role(s)[${rolesToRemove}] from member[${member.id}] in guild[${member.guild.id}]`
        )
      );
  };
}
