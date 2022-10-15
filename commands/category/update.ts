import {
  Channel,
  ChannelType,
  ChatInputCommandInteraction,
  PermissionsBitField,
  TextChannel,
} from 'discord.js';

import { EmbedService } from '../../src/services/embedService';
import { handleInteractionReply, reactToMessage } from '../../utilities/utils';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import {
  DELETE_REACT_MESSAGES_BY_MESSAGE_ID,
  GET_REACT_MESSAGE_BY_MESSAGE_ID,
} from '../../src/database/queries/reactMessage.query';
import { GET_CATEGORY_BY_ID } from '../../src/database/queries/category.query';
import { GET_REACT_ROLES_BY_CATEGORY_ID } from '../../src/database/queries/reactRole.query';
import { requiredPermissions } from '../../utilities/utilErrorMessages';

export class UpdateCategoryCommand extends SlashCommand {
  constructor() {
    super(
      'category-update',
      'Have an existing react role embed you want updated? Use this command!',
      Category.category,
      [PermissionsBitField.Flags.ManageRoles]
    );

    this.addStringOption(
      'message-link',
      'The link to the category embed message. This will be used to find and update the embed.',
      true
    );
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    const [messageLink] = this.extractStringVariables(
      interaction,
      'message-link'
    );

    if (!messageLink) {
      this.log.critical(
        `Undefined message-link despite being required in guild.`,
        interaction.guildId
      );

      return interaction.editReply(
        `Hey! Something happened and I can't see the passed in message link. Could you try again?`
      );
    }

    const [_, channelId, messageId] = messageLink.match(/\d+/g) ?? [];

    const channel = await interaction.guild?.channels
      .fetch(channelId)
      .catch((e) =>
        this.log.debug(
          `Failed to find channel[${channelId}]\n${e}`,
          interaction.guildId
        )
      );

    if (!channel || !isTextChannel(channel)) {
      return interaction.editReply(
        `Hey! I couldn't find that channel, make sure you're copying the message link right.`
      );
    }

    const permissionsError = requiredPermissions(channel.id);

    const message = await channel.messages
      .fetch(messageId)
      .catch((e) =>
        this.log.info(`Failed to fetch message[${messageId}]\n${e}`)
      );

    if (!message) {
      return interaction.editReply(permissionsError);
    }

    const reactMessage = await GET_REACT_MESSAGE_BY_MESSAGE_ID(messageId);

    if (!reactMessage) {
      this.log.info(
        `No react messages exist with messageId[${messageId}]`,
        interaction.guildId
      );

      return interaction.editReply(
        `Hey! I looked and didn't see any react roles saved that are associated with that message.`
      );
    }

    const category = await GET_CATEGORY_BY_ID(reactMessage.categoryId);

    if (!category) {
      this.log.info(
        `Category not found with categoryId[${reactMessage.categoryId}]]`,
        interaction.guildId
      );

      return interaction.editReply(
        `Hey! I couldn't find a category associated with that message.`
      );
    }

    const categoryRoles = await GET_REACT_ROLES_BY_CATEGORY_ID(category.id);

    if (!categoryRoles.length) {
      this.log.info(
        `Category[${category.id}] has no react roles associated with it.`,
        interaction.guildId
      );

      return interaction.editReply(
        `Hey! I see that message uses category \`${category.name}\` but it has no react roles in it.\n` +
          `Add some react roles to the category with \`/category-add\` and then try update again. Otherwise just delete it!`
      );
    }

    try {
      const embed = EmbedService.reactRoleEmbed(categoryRoles, category);

      // Remove all react messages since they are created and depend on RoleBots reactions
      await DELETE_REACT_MESSAGES_BY_MESSAGE_ID(reactMessage.messageId);

      // Clear all reactions to remove and old incorrect reactions.
      await message.reactions
        .removeAll()
        .catch(() =>
          this.log.info(`Failed to remove all reactions.`, interaction.guildId)
        );

      // We can only edit our own messages
      if (message.author === interaction.client.user) {
        await message.edit({ embeds: [embed] }).then(() => {
          this.log.info(
            `Updated category[${category.id}] embed.`,
            interaction.guildId
          );

          return interaction.editReply(
            `Hey! I updated the react role embed message related to this category.`
          );
        });
      }

      // Re-react to the message with the updated react role list.
      const isSuccessfulReacting = await reactToMessage(
        message,
        interaction.guildId,
        categoryRoles,
        channel.id,
        reactMessage.categoryId,
        reactMessage.isCustomMessage,
        this.log
      );

      if (!isSuccessfulReacting) {
        return handleInteractionReply(this.log, interaction, {
          ephemeral: true,
          content: permissionsError,
        });
      }
    } catch (e) {
      this.log.error(
        `Failed to edit category[${category.id}] embed and re-react to it\n${e}`,
        interaction.guildId
      );
    }

    return interaction.editReply(
      `Hey! I've successfully re-reacted to the message for you.`
    );
  };
}

function isTextChannel(channel: Channel): channel is TextChannel {
  return channel.type === ChannelType.GuildText;
}
