import {
  ApplicationCommandOptionType,
  Channel,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  Message,
  TextChannel,
} from 'discord.js';
import { ReactRole } from '../../src/database/entities';
import { ICategory } from '../../src/database/entities/category.entity';
import {
  GuildReactType,
  IGuildConfig,
} from '../../src/database/entities/guild.entity';
import { GET_CATEGORY_BY_ID } from '../../src/database/queries/category.query';
import {
  CREATE_GUILD_CONFIG,
  GET_GUILD_CONFIG,
} from '../../src/database/queries/guild.query';
import {
  CREATE_REACT_MESSAGE,
  DELETE_REACT_MESSAGES_BY_MESSAGE_ID,
  GET_REACT_MESSAGE_BY_MESSAGE_ID,
} from '../../src/database/queries/reactMessage.query';
import { GET_REACT_ROLES_BY_CATEGORY_ID } from '../../src/database/queries/reactRole.query';
import { EmbedService } from '../../src/services/embedService';
import { reactRoleButtons } from '../../utilities/utilButtons';
import { requiredPermissions } from '../../utilities/utilErrorMessages';
import { reactToMessage } from '../../utilities/utils';
import { SlashSubCommand } from '../command';

export class UpdateSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(baseCommand, 'update', 'Update an existing RoleBot message embed.', [
      {
        name: 'message-link',
        description: 'The link to the category embed message.',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ]);
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const { guildId } = interaction;

    await interaction.deferReply({
      ephemeral: true,
    });

    const messageLink = this.expect(
      interaction.options.getString('message-link'),
      {
        message:
          'Make sure to pass the message link by right click copying it on desktop!',
        prop: 'message-link',
      }
    );

    const [_, channelId, messageId] = messageLink.match(/\d+/g) ?? [];

    const channel = await interaction.guild?.channels
      .fetch(channelId)
      .catch((e) =>
        this.log.debug(`Failed to find channel[${channelId}]\n${e}`, guildId)
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
        guildId
      );

      return interaction.editReply(
        `Hey! I looked and didn't see any react roles saved that are associated with that message.`
      );
    }

    const category = await GET_CATEGORY_BY_ID(reactMessage.categoryId);

    if (!category) {
      this.log.info(
        `Category not found with categoryId[${reactMessage.categoryId}]]`,
        guildId
      );

      return interaction.editReply(
        `Hey! I couldn't find a category associated with that message.`
      );
    }

    const categoryRoles = await GET_REACT_ROLES_BY_CATEGORY_ID(
      guildId,
      category.id,
      category.displayOrder
    );

    if (!categoryRoles.length) {
      this.log.info(
        `Category[${category.id}] has no react roles associated with it.`,
        guildId
      );

      return interaction.editReply(
        `Hey! I see that message uses category \`${category.name}\` but it has no react roles in it.\n` +
          `Add some react roles to the category with \`/category add\` and then try update again. Otherwise just delete it!`
      );
    }

    let config = await GET_GUILD_CONFIG(guildId);
    if (!config) {
      config = await CREATE_GUILD_CONFIG(guildId);
    }

    try {
      const embed = EmbedService.reactRoleEmbed(
        categoryRoles,
        category,
        config?.hideEmojis
      );

      // Remove all react messages since they are created and depend on RoleBots reactions
      await DELETE_REACT_MESSAGES_BY_MESSAGE_ID(reactMessage.messageId);

      // Clear all reactions to remove any old incorrect reactions.
      await message.reactions
        .removeAll()
        .catch(() =>
          this.log.info(`Failed to remove all reactions.`, message.guildId)
        );

      switch (config.reactType) {
        case GuildReactType.button:
          await this.handleButtonType(
            interaction,
            categoryRoles,
            embed,
            category,
            config,
            message,
            channel
          );
          break;

        case GuildReactType.reaction:
          await this.handleReactionType(
            interaction,
            message,
            embed,
            categoryRoles,
            category,
            channel
          );

          return interaction.editReply(
            `Hey! I've successfully re-reacted to the message for you.`
          );
      }
    } catch (e) {
      this.log.error(
        `Failed to edit category[${category.id}] embed and re-react to it\n${e}`,
        interaction.guildId
      );
    }
  };

  handleButtonType = async (
    interaction: ChatInputCommandInteraction,
    roles: ReactRole[],
    embed: EmbedBuilder,
    category: ICategory,
    config: IGuildConfig,
    message: Message,
    channel: Channel
  ) => {
    if (!interaction.guildId) throw 'Interaction guild ID missing';
    if (message.author !== interaction.client.user) {
      return interaction.editReply(
        `Hey! I can only edit embeds and buttons that are MY message! Make sure the message you're copying is correct.`
      );
    }

    const buttons = reactRoleButtons(roles, config.hideEmojis);

    await CREATE_REACT_MESSAGE({
      messageId: message.id,
      emojiId: roles[0].emojiId,
      roleId: roles[0].roleId,
      guildId: interaction.guildId,
      categoryId: category.id,
      isCustomMessage: false,
      channelId: channel.id,
    });

    await message
      .edit({ embeds: [embed], components: buttons })
      .then(() => {
        return interaction.editReply(`Hey! I updated that embed for you.`);
      })
      .catch((e) => {
        this.log.error(
          `Failed to update message embed.\n${e}`,
          interaction.guildId
        );

        return interaction.editReply(
          `Hey! I couldn't edit the embed, am I missing READ HISTORY / MANAGE MESSAGE permissions?`
        );
      });
  };

  handleReactionType = async (
    interaction: ChatInputCommandInteraction,
    message: Message,
    embed: EmbedBuilder,
    roles: ReactRole[],
    category: ICategory,
    channel: Channel
  ) => {
    if (!message.guildId) throw 'Message has no guild ID';

    const permissionsError = requiredPermissions(channel.id);
    let isCustomMessage = true;

    // We can only edit our own messages
    if (message.author === interaction.client.user) {
      isCustomMessage = false;
      await message.edit({ embeds: [embed], components: [] }).then(() => {
        this.log.info(
          `Updated category[${category.id}] embed.`,
          message.guildId
        );

        return interaction.editReply(
          `Hey! I updated the react role embed message related to this category.`
        );
      });
    }

    // Re-react to the message with the updated react role list.
    const isSuccessfulReacting = await reactToMessage(
      message,
      message.guildId,
      roles,
      channel.id,
      category.id,
      isCustomMessage,
      this.log
    );

    if (!isSuccessfulReacting) {
      return interaction.editReply(permissionsError);
    }
  };
}

function isTextChannel(channel: Channel): channel is TextChannel {
  return channel.type === ChannelType.GuildText;
}
