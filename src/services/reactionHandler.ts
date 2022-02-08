import {
  GuildMember,
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  User,
} from 'discord.js';
import {
  GET_CATEGORY_BY_ID,
  GET_REACT_MESSAGE_BY_MSGID_AND_EMOJI_ID,
  GET_REACT_ROLES_BY_CATEGORY_ID,
} from '../database/database';
import { ReactMessage } from '../database/entities';
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

    const reactMessage = await GET_REACT_MESSAGE_BY_MSGID_AND_EMOJI_ID(
      message.id,
      emojiId
    ).catch((e) => {
      this.log.error(`Failed to query for react message.`);
      this.log.error(`${e}`);
    });

    if (!reactMessage) return;

    if (!reactMessage.categoryId) {
      return this.log.error(
        `React role[${reactMessage.id}] in guild[${guild.id}] does NOT have a category set.`
      );
    }

    const member = await guild.members.fetch(user.id).catch((e) => {
      this.log.error(`Fetching user[${user.id}] threw an error.`);
      this.log.critical(`${e}`);
    });

    if (!member) {
      return this.log.debug(
        `Failed to fetch member with user[${user.id}] for reaction[${type}] on guild[${guild.id}]`
      );
    }

    const category = await GET_CATEGORY_BY_ID(reactMessage.categoryId);

    if (!category) {
      return this.log.error(
        `Category[${reactMessage.categoryId}] does not exist for guild[${guild.id}]`
      );
    }

    if (category.mutuallyExclusive) {
      return this.mutuallyExclusive(reactMessage, member, type);
    }

    switch (type) {
      case 'add':
        member.roles.add(reactMessage.roleId).catch((e) => {
          this.log.error(
            `Cannot give role[${reactMessage.roleId}] to user[${member?.id}]`
          );
          this.log.critical(`${e}`);
        });
        break;
      case 'remove':
        member.roles.remove(reactMessage.roleId).catch((e) => {
          this.log.error(
            `Cannot remove role[${reactMessage.roleId}] from user[${member?.id}]`
          );
          this.log.critical(`${e}`);
        });
    }
  };

  mutuallyExclusive = async (
    reactMessage: ReactMessage,
    member: GuildMember,
    type: 'add' | 'remove'
  ) => {
    // If it's removing it's pretty simple.
    if (type === 'remove') {
      return member.roles
        .remove(reactMessage.roleId)
        .catch(() =>
          this.log.debug(
            `Failed to remove role[${reactMessage.roleId}] from user[${member.id}] because they unreacted.`
          )
        );
    }

    // If we're ADDING a role then we need to figure out what out one they had.

    if (!reactMessage.categoryId) {
      return this.log.error(
        `React role[${reactMessage.id}] category is undefined.`
      );
    }

    const categoryRoles = (
      await GET_REACT_ROLES_BY_CATEGORY_ID(reactMessage.categoryId)
    ).map((r) => r.roleId);

    const rolesToRemove = member.roles.cache.filter(
      (r) => r.id !== reactMessage.roleId && categoryRoles.includes(r.id)
    );

    member.roles
      .add(reactMessage.roleId)
      .catch(() =>
        this.log.debug(
          `Could not add role[${reactMessage.roleId}] to member[${member.id}] in guild[${member.guild.id}]`
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
