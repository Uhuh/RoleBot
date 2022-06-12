import {
  AnyChannel,
  CommandInteraction,
  MessageActionRow,
  MessageSelectMenu,
  Permissions,
  SelectMenuInteraction,
  TextChannel,
} from 'discord.js-light';
import RoleBot from '../../src/bot';
import {
  GET_CATEGORY_BY_ID,
  GET_GUILD_CATEGORIES,
  GET_REACT_ROLES_BY_CATEGORY_ID,
} from '../../src/database/database';
import { handleInteractionReply, reactToMessage } from '../../utilities/utils';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class ReactMessageCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'react-message',
      'Use this command to react with a specific category of roles to a message.',
      Category.react,
      [Permissions.FLAGS.MANAGE_ROLES]
    );

    this.addStringOption(
      'message-link',
      'Copy a message link and place it here for the message you want me to react to.',
      true
    );
  }

  handleSelect = async (interaction: SelectMenuInteraction, args: string[]) => {
    const [guildId, channelId, messageId, categoryId] = args;

    const channel = await this.client.channels.fetch(channelId);

    if (!channel || !isTextChannel(channel)) {
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! I had an issue handling the option you selected for \`/${this.name}\`. Please wait a moment and try again.`,
      });
    }

    const message = await channel.messages.fetch(messageId);

    if (!message) {
      this.log.debug(
        `User gave message[${messageId}] that doesn't exist in channel[${channelId}]`,
        interaction.guildId
      );

      return handleInteractionReply(this.log, interaction, `Hey! I had an issue finding that message. Give me a sec and try again.`);
    }

    const category = await GET_CATEGORY_BY_ID(Number(categoryId));

    if (!category) {
      this.log.info(
        `Category[${categoryId}] is missing for guild despite having passed previous check.`,
        interaction.guildId
      );

      return handleInteractionReply(this.log, interaction, `Hey! I had an issue finding that category. Please wait a second and try again.`);
    }

    const reactRoles = await GET_REACT_ROLES_BY_CATEGORY_ID(Number(categoryId));

    if (!reactRoles.length) {
      this.log.error(
        `Category[${categoryId}] in guild somehow has no react roles associated with it.`,
        interaction.guildId
      );

      return handleInteractionReply(this.log, interaction, `Hey! I had issues getting the react roles for the category. Can you wait a sec and try again?`);
    }

    handleInteractionReply(this.log, interaction, {
      ephemeral: true,
      content: `I'm reacting to the message with all react roles associated with ${category.name}. Please give me a moment to react fully before obtaining roles.`,
    });

    reactToMessage(
      message,
      interaction.guildId || guildId,
      reactRoles,
      channel.id,
      category.id,
      true,
      this.log
    );
  };

  execute = async (interaction: CommandInteraction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;

    const [messageLink] = this.extractStringVariables(
      interaction,
      'message-link'
    );

    if (!messageLink) {
      return handleInteractionReply(this.log, interaction, `Hmm, I'm not sure what happened but I can't see the message link. Please try again.`);
    }

    const [_, channelId, messageId] = messageLink.match(/\d+/g) ?? [];

    if (!channelId || !messageId) {
      return handleInteractionReply(this.log, interaction, `Hey! That doesn't look like a valid message link. Make sure to right click and copy \`Copy Message Link \``);
    }

    const channel = await interaction.guild?.channels
      .fetch(channelId)
      .catch((e) =>
        this.log.error(
          `Failed to fetch channel[${channelId}]\n${e}`,
          interaction.guildId
        )
      );

    if (!channel || !isTextChannel(channel)) {
      return handleInteractionReply(this.log, interaction, `Hey! I couldn't find that channel, make sure you're copying the message link right.`);
    }

    const message = await channel.messages
      .fetch(messageId)
      .catch((e) =>
        this.log.error(
          `Failed to fetch message[${messageId}] for channel[${channel.id}]\n${e}`,
          interaction.guildId
        )
      );

    if (!message) {
      return handleInteractionReply(this.log, interaction, `Hey! I couldn't find that message, make sure you're copying the message link right.`);
    }

    // Trying to be as detailed as possible to user if categories don't exist or if they are all empty.
    const guildHasNoCategories = `It appears there are no categories! Try out \`/category-create\` to create a category reaction pack to store and manage your roles much easier.`;
    const allCategoriesAreEmpty = `Hey! It appears all your categories are empty. I can't react to the message you want if you have at least one react role in at least one category. Check out \`/category-add\` to start adding roles to a category.`;

    const categories = await GET_GUILD_CATEGORIES(interaction.guildId).catch(
      (e) =>
        this.log.error(
          `Failed to get categories\n${e}`,
          interaction.guildId
        )
    );

    // This should only happen if typeorm throws an error.
    if (!categories) {
      return handleInteractionReply(this.log, interaction, `Hey! I'm encountering an issue trying to access the servers categories. Please be patient.`);
    }

    const guildHasCategories = categories.length;

    const categoryRoles = await Promise.all(
      categories.map((c) => GET_REACT_ROLES_BY_CATEGORY_ID(c.id))
    );

    // Presumably, if all the array of roles for each category is length 0 then this being 0 is "false"
    const allEmptyCategories = categoryRoles.filter((r) => r.length).length;

    if (!guildHasCategories) {
      this.log.info(
        `Guild has no categories.`,
        interaction.guildId
      );

      return handleInteractionReply(this.log, interaction, guildHasNoCategories);
    } else if (!allEmptyCategories) {
      this.log.debug(
        `Guild has categories but all of them are empty.`,
        interaction.guildId
      );

      return handleInteractionReply(this.log, interaction, allCategoriesAreEmpty);
    }

    const selectMenu = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId(`select-message`)
        .setPlaceholder(`Pick a category to react with.`)
        .addOptions(
          categories.map((c, idx) => ({
            label: c.name ?? `Category-${idx}`,
            // Discord has a 100 character limit for select menus.
            description: c.description?.slice(0, 99) ?? '',
            value: `${this.name}_${c.guildId}-${channelId}-${messageId}-${c.id}`,
          }))
        )
    );

    interaction
      .reply({
        content: `Let's make this easier for you. Select a category and I will use the reaction roles in that category to react to the message.`,
        components: [selectMenu],
      })
      .catch((e) => this.log.error(`Interaction failed.\n${e}`, interaction.guildId));
  };
}

function isTextChannel(channel: AnyChannel): channel is TextChannel {
  return channel.type === 'GUILD_TEXT';
}
