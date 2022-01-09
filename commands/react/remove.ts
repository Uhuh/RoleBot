import { CommandInteraction, Permissions } from 'discord.js';
import RoleBot from '../../src/bot';
import {
  DELETE_REACT_MESSAGES_BY_MESSAGE_ID,
  DELETE_REACT_ROLE_BY_ROLE_ID,
  GET_CATEGORY_BY_ID,
  GET_REACT_MESSAGE_BY_ROLE_ID,
  GET_REACT_ROLE_BY_ROLE_ID,
  GET_ROLES_BY_CATEGORY_ID,
} from '../../src/database/database';
import { EmbedService } from '../../src/services/embedService';
import { reactToMessage } from '../../utilities/functions/reactions';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class ReactDeleteCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'react-remove',
      'Remove an existing reaction role from a drop down menu.',
      Category.react,
      [Permissions.FLAGS.MANAGE_ROLES]
    );

    this.addRoleOption('role', `The reaction role you want to remove.`, true);
  }

  /**
   * Check if there are any existing react messages and update the embeds if there are.
   * @param roleId This is to get any existing react emssages.
   */
  updateMessageReactions = async (roleId: string) => {
    try {
      const reactMessage = await GET_REACT_MESSAGE_BY_ROLE_ID(roleId);

      if (!reactMessage) {
        return this.log.debug(`ReactMessage didn't exist for role[${roleId}]`);
      }

      const guild = await this.client.guilds.fetch(reactMessage.guildId);
      const channel = await guild.channels.fetch(reactMessage.channelId);

      if (!channel?.isText()) {
        return this.log.debug(
          `Guild[${reactMessage.guildId}] apparently does not have channel[${reactMessage.channelId}]`
        );
      }

      const message = await channel.messages.fetch(reactMessage.messageId);

      await DELETE_REACT_MESSAGES_BY_MESSAGE_ID(reactMessage.messageId);

      if (!message) {
        return this.log.debug(
          `Could not find message[${reactMessage.messageId}] in channel[${reactMessage.channelId}] in guild[${reactMessage.guildId}]`
        );
      }

      await message.reactions.removeAll();

      const categoryRoles = await GET_ROLES_BY_CATEGORY_ID(
        reactMessage.categoryId
      );
      const category = await GET_CATEGORY_BY_ID(reactMessage.categoryId);

      if (!category) {
        return this.log.critical(
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
            this.log.error(
              `Failed to edit message[${reactMessage.messageId}] with updated react role embed in guild[${guild.id}]`
            )
          );
      }

      reactToMessage(
        message,
        categoryRoles,
        channel.id,
        reactMessage.categoryId,
        reactMessage.isCustomMessage,
        this.log
      );
    } catch (e) {
      this.log.error(`Failed to update react embed message.`);
      this.log.error(`${e}`);
    }
  };

  execute = async (interaction: CommandInteraction) => {
    const role = interaction.options.get('role')?.role;

    if (!role) {
      this.log.error(
        `Interaction was missing role property despite it being required.`
      );

      return interaction
        .reply({
          ephemeral: true,
          content: `Hey! For some reason I was unable to get the role that you told me to delete. Is it already deleted? Please try again. :)`,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    const reactRole = await GET_REACT_ROLE_BY_ROLE_ID(role.id);

    if (!reactRole) {
      this.log.debug(
        `User passed in role[${role.id}] that isn't in guilds reactRoles list.`
      );

      return interaction
        .reply({
          ephemeral: true,
          content: `Hey! That role isn't in my system, perhaps you meant to pass in a different role?`,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }
    try {
      await DELETE_REACT_ROLE_BY_ROLE_ID(role.id);

      this.log.debug(
        `Successfully removed guilds[${interaction.guildId}] react role[${role.id}]`
      );

      const emojiMention =
        reactRole.emojiId.length > 3
          ? `<:n:${reactRole.emojiId}>`
          : reactRole.emojiId;

      interaction
        .reply({
          ephemeral: true,
          content: `I successfully removed the react role (${emojiMention} - <@${role.id}>)! You can add it back at any time if you wish.\n\nI'm gonna do some cleanup now and update any react role embed...`,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });

      // Let's try to update the users react role message. If it exist.
      this.updateMessageReactions(role.id);
    } catch (e) {
      this.log.error(
        `Error'd when trying to delete react role[${role.id}] on guild[${interaction.guildId}]`
      );
      this.log.critical(`${e}`);

      interaction
        .reply({
          ephemeral: true,
          content: `Hey! I had an issue deleting that react role. Please wait a moment and try again.`,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }
  };
}
