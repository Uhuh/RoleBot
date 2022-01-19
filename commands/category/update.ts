import {
  Channel,
  CommandInteraction,
  Permissions,
  TextChannel,
} from 'discord.js';
import RoleBot from '../../src/bot';
import {
  GET_CATEGORY_BY_ID,
  GET_REACT_MESSAGE_BY_MESSAGE_ID,
  GET_REACT_ROLES_BY_CATEGORY_ID,
} from '../../src/database/database';
import { EmbedService } from '../../src/services/embedService';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class UpdateCategoryCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'category-update',
      'Have an existing react role embed you want updated? Use this command!',
      Category.category,
      [Permissions.FLAGS.MANAGE_ROLES]
    );

    this.addStringOption(
      'message-link',
      'The link to the category embed messge. This will be used to find and update the embed.',
      true
    );
  }

  execute = async (interaction: CommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const [messageLink] = this.extractStringVariables(
      interaction,
      'message-link'
    );

    if (!messageLink) {
      this.log.critical(
        `Undefined message-link despite being required in guild[${interaction.guildId}].`
      );

      return interaction
        .reply({
          ephemeral: true,
          content: `Hey! Something happened and I can't see the passed in emssage link. Could you try again?`,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    const [_, channelId, messageId] = messageLink.match(/\d+/g) ?? [];

    const channel = await interaction.guild?.channels.fetch(channelId);

    if (!channel || !isTextChannel(channel)) {
      return await interaction
        .reply(
          `Hey! I couldn't find that channel, make sure you're copying the message link right.`
        )
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    const message = await channel.messages.fetch(messageId);

    if (!message) {
      return await interaction
        .reply(
          `Hey! I couldn't find that message, make sure you're copying the message link right.`
        )
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    const reactMessage = await GET_REACT_MESSAGE_BY_MESSAGE_ID(messageId);

    if (!reactMessage) {
      this.log.debug(
        `No react messages exist with messageId[${messageId}] in guild[${interaction.guildId}]`
      );

      return interaction.reply({
        ephemeral: true,
        content: `Hey! I looked and didn't see any react roles saved that are associated with that message.`,
      });
    }

    const category = await GET_CATEGORY_BY_ID(reactMessage.categoryId);

    if (!category) {
      this.log.debug(
        `Category not found with categoryId[${reactMessage.categoryId}]] in guild[${interaction.guildId}]`
      );

      return interaction
        .reply(
          `Hey! I couldn't find a category with that name. The name is _case sensitive_ so make sure it's typed correctly.`
        )
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    const categoryRoles = await GET_REACT_ROLES_BY_CATEGORY_ID(category.id);

    if (!categoryRoles || !categoryRoles.length) {
      this.log.debug(
        `Category[${category.id}] in guild[${category.guildId}] has no react roles associated with it.`
      );

      return interaction.reply({
        ephemeral: true,
        content: `Hey! I see that message uses category \`${category.name}\` but it has no react roles in it.`,
      });
    }

    const embed = EmbedService.reactRoleEmbed(categoryRoles, category);

    message
      .edit({ embeds: [embed] })
      .then(() => {
        this.log.debug(`Updated category[${category.id}] embed.`);

        interaction.reply({
          ephemeral: true,
          content: `Hey! I updated the react role embed message related to this category.`,
        });
      })
      .catch((e) => {
        this.log.error(`Failed to update message for category[${category.id}]`);

        interaction.reply({
          ephemeral: true,
          content: `Hey! I wasn't able to update the message for some reason.`,
        });
      });
  };
}

function isTextChannel(channel: Channel): channel is TextChannel {
  return channel.type === 'GUILD_TEXT';
}
