import {
  Channel,
  CommandInteraction,
  MessageActionRow,
  MessageSelectMenu,
  Permissions,
  SelectMenuInteraction,
  TextChannel,
} from 'discord.js';
import RoleBot from '../../src/bot';
import {
  GET_CATEGORY_BY_ID,
  GET_GUILD_CATEGORIES,
  GET_REACT_ROLES_BY_CATEGORY_ID,
} from '../../src/database/database';
import { reactToMessage } from '../../utilities/functions/reactions';
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
      return interaction
        .reply({
          ephemeral: true,
          content: `Hey! I had an issue handling the option you selected for \`/${this.name}\`. Please wait a moment and try again.`,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    const message = await channel.messages.fetch(messageId);

    if (!message) {
      this.log.debug(
        `User gave message[${messageId}] that doesn't exist in channel[${channelId}] in guild[${guildId}]`
      );

      return interaction.reply(
        `Hey! I had an issue finding that message. Give me a sec and try again.`
      );
    }

    const category = await GET_CATEGORY_BY_ID(Number(categoryId));

    if (!category) {
      this.log.error(
        `Category[${categoryId}] is missing for guild[${guildId}] despite having passed previous check.`
      );

      return interaction.reply(
        `Hey! I had an issue finding that category. Please wait a second and try again.`
      );
    }

    const reactRoles = await GET_REACT_ROLES_BY_CATEGORY_ID(Number(categoryId));

    if (!reactRoles.length) {
      this.log.error(
        `Category[${categoryId}] in guild[${guildId}] somehow has no react roles associated with it.`
      );

      return interaction.reply(
        `Hey! I had issues getting the react roles for the category. Can you wait a sec and try again?`
      );
    }

    interaction
      .reply({
        ephemeral: true,
        content: `I'm reacting to the message with all react roles associated with ${category.name}. Please give me a moment to react fully before obtaining roles.`,
      })
      .catch((e) => {
        this.log.error(`Failed to tell user we're reacting`);
        this.log.critical(`${e}`);
      });

    reactToMessage(
      message,
      reactRoles,
      channel.id,
      category.id,
      true,
      this.log
    );
  };

  execute = async (interaction: CommandInteraction) => {
    if (!interaction.isCommand()) return;

    const [messageLink] = this.extractStringVariables(
      interaction,
      'message-link'
    );

    if (!messageLink) {
      return await interaction
        .reply(
          `Hmm, I'm not sure what happened but I can't see the message link. Please try again.`
        )
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    const [_, channelId, messageId] = messageLink.match(/\d+/g) ?? [];

    if (!channelId || !messageId) {
      return interaction
        .reply(
          `Hey! That doesn't look like a valid message link. Make sure to right click and copy \`Copy Message Link \``
        )
        .catch((e) => {
          this.log.error(`Failed to alert user about invalid message link`);
          this.log.critical(`${e}`);
        });
    }

    const channel = await interaction.guild?.channels
      .fetch(channelId)
      .catch((e) => {
        this.log.error(
          `Failed to fetch channel[${channelId}] in guild[${interaction.guildId}]`
        );
        this.log.critical(e);
      });

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

    const message = await channel.messages.fetch(messageId).catch((e) => {
      this.log.error(
        `Failed to fetch message[${messageId}] for channel[${channel.id}]`
      );
      this.log.critical(`${e}`);
    });

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

    // Trying to be as detailed as possible to user if categories don't exist or if they are all empty.
    const guildHasNoCategories = `It appears there are no categories! Try out \`/category-create\` to create a category reaction pack to store and manage your roles much easier.`;
    const allCategoriesAreEmpty = `Hey! It appears all your categories are empty. I can't react to the message you want if you have at least one react role in at least one category. Check out \`/category-add\` to start adding roles to a category.`;

    const categories = await GET_GUILD_CATEGORIES(interaction.guildId).catch(
      (e) => {
        this.log.error(
          `Failed to get categories for guild[${interaction.guildId}]`
        );
        this.log.error(e);
      }
    );

    // This should only happen if typeorm throws an error.
    if (!categories) {
      return interaction.reply(
        `Hey! I'm encountering an issue trying to access the servers categories. Please be patient.`
      );
    }

    const guildHasCategories = categories.length;

    const categoryRoles = await Promise.all(
      categories.map((c) => GET_REACT_ROLES_BY_CATEGORY_ID(c.id))
    );

    // Presumably, if all the array of roles for each category is length 0 then this being 0 is "false"
    const allEmptyCategories = categoryRoles.filter((r) => r.length).length;

    if (!guildHasCategories) {
      this.log.debug(
        `Guild[${interaction.guildId}] has no categories. Cannot do command[${this.name}]`
      );

      return interaction
        .reply({
          content: guildHasNoCategories,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    } else if (!allEmptyCategories) {
      this.log.debug(
        `Guild[${interaction.guildId}] has categories but all of them are empty.`
      );

      return interaction
        .reply({
          content: allCategoriesAreEmpty,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    const selectMenu = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId(`select-message`)
        .setPlaceholder(`Pick a category to react with.`)
        .addOptions(
          categories.map((c, idx) => ({
            label: c.name ?? `Category-${idx}`,
            description: c.description ?? '',
            value: `${this.name}_${c.guildId}-${channelId}-${messageId}-${c.id}`,
          }))
        )
    );

    await interaction
      .reply({
        content: `Let's make this easier for you. Select a category and I will use the reaction roles in that category to react to the message.`,
        components: [selectMenu],
      })
      .catch((e) => {
        this.log.error(`Interaction failed.`);
        this.log.error(`${e}`);
      });
  };
}

function isTextChannel(channel: Channel): channel is TextChannel {
  return channel.type === 'GUILD_TEXT';
}
