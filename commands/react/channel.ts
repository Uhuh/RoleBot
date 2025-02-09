import {
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChannelType,
  ChatInputCommandInteraction, MessageFlags,
  TextChannel,
} from 'discord.js';
import { setTimeout } from 'timers/promises';
import { Category, ReactRole } from '../../src/database/entities';
import { GuildReactType } from '../../src/database/entities/guild.entity';
import { GET_CATEGORY_BY_ID, GET_GUILD_CATEGORIES } from '../../src/database/queries/category.query';
import { CREATE_GUILD_CONFIG, GET_GUILD_CONFIG } from '../../src/database/queries/guild.query';
import { CREATE_REACT_MESSAGE } from '../../src/database/queries/reactMessage.query';
import {
  GET_GUILD_CATEGORY_ROLE_COUNT,
  GET_REACT_ROLES_BY_CATEGORY_ID,
} from '../../src/database/queries/reactRole.query';
import { handleAutocompleteCategory } from '../../utilities/utilAutocomplete';
import { reactRoleButtons } from '../../utilities/utilButtons';
import { requiredPermissions } from '../../utilities/utilErrorMessages';
import { reactToMessage } from '../../utilities/utils';
import { SlashSubCommand } from '../command';
import { categoryEmbedDescription, reactRoleEmbed } from '../../utilities/utilEmbedHelpers';

const enum CommandOptionNames {
  Channel = 'channel',
  Category = 'category',
}

export class ChannelSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(
      baseCommand,
      'channel',
      'Send all or one categories to a selected channel.',
      [
        {
          name: CommandOptionNames.Channel,
          description: 'The channel to send to.',
          type: ApplicationCommandOptionType.Channel,
          required: true,
        },
        {
          name: CommandOptionNames.Category,
          description: 'Send a single category to the channel.',
          type: ApplicationCommandOptionType.String,
          autocomplete: true,
        },
      ],
    );
  }

  handleAutoComplete = async (interaction: AutocompleteInteraction) => {
    try {
      await handleAutocompleteCategory(interaction);
    } catch (e) {
      this.log.error(`Failed to get categories for autocomplete.\n${e}`);

      await interaction.respond([
        { name: `SHOULD NOT SEE THIS! :)`, value: 'oopsies!' },
      ]);
    }
  };

  handleSingleCategory = async (
    interaction: ChatInputCommandInteraction,
    categoryId: number,
  ) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const channel = this.expect(interaction.options.getChannel(CommandOptionNames.Channel), {
      message: `Hey! I can't find the channel! Please wait and try again.`,
      prop: CommandOptionNames.Channel,
    });

    if (channel.type !== ChannelType.GuildText) {
      this.log.error(`Passed in channel was invalid.`, interaction.guildId);

      return interaction
        .editReply(`Hey! I only support sending embeds to text channels!`)
        .catch((e) =>
          this.log.error(`Interaction failed.\n${e}`, interaction.guildId),
        );
    }

    const textChannel = this.expect(
      await interaction.guild?.channels.fetch(channel.id),
      {
        message: `Failed to find the channel just passed in!`,
        prop: 'text channel',
      },
    );

    if (textChannel.type !== ChannelType.GuildText) return;

    const category = this.expect(await GET_CATEGORY_BY_ID(categoryId), {
      message: `I failed to find the category! Please wait and try again.`,
      prop: CommandOptionNames.Category,
    });

    const roles = await GET_REACT_ROLES_BY_CATEGORY_ID(
      category.id,
      category.displayOrder,
    );
    if (!roles.length)
      return interaction.editReply(
        `Hey! That category has no react roles associated with it. How about adding some.`,
      );

    return this.messageChannelAndReact(
      interaction,
      textChannel,
      category,
      roles,
    );
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const { guildId } = interaction;

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    /**
     * If the user passed in a category we don't need to waste time here.
     */
    const categoryId = interaction.options.getString(CommandOptionNames.Category);

    if (categoryId && !isNaN(Number(categoryId))) {
      return this.handleSingleCategory(interaction, Number(categoryId));
    } else if (categoryId) {
      return interaction.editReply(
        `Hey! You need to wait for options to show before hitting enter. You entered "${categoryId}" which isn't a category here.`,
      );
    }

    const categories = await GET_GUILD_CATEGORIES(guildId).catch((e) =>
      this.log.error(`Failed to get categories\n${e}`, guildId),
    );

    if (!categories) {
      this.log.debug(`Guild has no categories.`, guildId);

      return interaction.editReply(
        `Hey! You need to make some categories and fill them with react roles before running this command. Check out \`/category add\`.`,
      );
    }

    // Stolen from @react/message execute function
    const allCategoriesAreEmpty = `Hey! It appears all your categories are empty. I can't react to the message you want if you have at least one react role in at least one category. Check out \`/category add\` to start adding roles to a category.`;
    const categoryRolesCount = await GET_GUILD_CATEGORY_ROLE_COUNT(guildId);

    if (!categoryRolesCount) {
      this.log.debug(
        `Guild has categories but all of them are empty.`,
        guildId,
      );

      return interaction.editReply({
        content: allCategoriesAreEmpty,
      });
    }

    const channel = this.expect(interaction.options.getChannel('channel'), {
      message: `Hey! I failed to find the channel from the command. Please wait a second and try again.`,
      prop: 'channel',
    });

    if (channel?.type !== ChannelType.GuildText) {
      this.log.error(
        `Passed in channel[${channel.id}] was not a text channel`,
        guildId,
      );

      return interaction.editReply(
        `Hey! I only support sending embeds to text channels!`,
      );
    }

    const textChannel = await interaction.guild?.channels.fetch(channel.id);
    if (textChannel?.type !== ChannelType.GuildText) return;

    for (const category of categories) {
      const roles = await GET_REACT_ROLES_BY_CATEGORY_ID(
        category.id,
        category.displayOrder,
      );
      if (!roles.length) continue;

      await this.messageChannelAndReact(
        interaction,
        textChannel,
        category,
        roles,
      );

      await setTimeout(1000);
    }
  };

  private messageChannelAndReact = async (
    interaction: ChatInputCommandInteraction,
    channel: TextChannel,
    category: Category,
    roles: ReactRole[],
  ) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const { guildId } = interaction;

    let config = await GET_GUILD_CONFIG(guildId);
    if (!config) {
      config = await CREATE_GUILD_CONFIG(guildId);
    }

    const hideEmojis =
      config.reactType === GuildReactType.button ? config?.hideEmojis : false;

    const messageOptions = {
      embeds: !config.hideEmbed
        ? [reactRoleEmbed(roles, category, hideEmojis)]
        : [],
      content: config.hideEmbed
        ? categoryEmbedDescription(roles, category, hideEmojis)
        : '',
      components:
        config.reactType === GuildReactType.button
          ? reactRoleButtons(roles, config.hideEmojis)
          : [],
    };

    const permissionError = requiredPermissions(channel.id);

    try {
      const message = await channel.send(messageOptions);

      switch (config?.reactType) {
        case GuildReactType.button: {
          /**
           * When the server uses buttons we don't react, so just save whatever the first react role emoji and role id are.
           * This is so we can get the message later whenever a user wants to update this embed.
           */
          await CREATE_REACT_MESSAGE({
            messageId: message.id,
            emojiId: roles[0].emojiId,
            roleId: roles[0].roleId,
            guildId: guildId,
            categoryId: category.id,
            isCustomMessage: false,
            channelId: channel.id,
          });
          break;
        }
        case GuildReactType.reaction:
        default: {
          const isSuccessfulReacting = await reactToMessage(
            message,
            guildId,
            roles,
            channel.id,
            category.id,
            false,
            this.log,
          );

          if (!isSuccessfulReacting) {
            await message.delete();

            return interaction.editReply(permissionError);
          }
        }
      }
    } catch (e) {
      this.log.error(`Failed to send embeds.\n${e}`, interaction.guildId);

      return interaction.editReply(permissionError);
    }

    await interaction.editReply({
      content: 'Hey! Check the channel to make sure I worked properly.',
    });
  };
}
