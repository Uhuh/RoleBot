import {
  AutocompleteInteraction,
  ButtonStyle,
  ButtonBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  PermissionsBitField,
  TextChannel,
} from 'discord.js';

import { EmbedService } from '../../src/services/embedService';
import { reactToMessage, spliceIntoChunks } from '../../utilities/utils';
import { Category as CommandCategory } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import {
  GET_CATEGORY_BY_ID,
  GET_GUILD_CATEGORIES,
} from '../../src/database/queries/category.query';
import {
  GET_GUILD_CATEGORY_ROLE_COUNT,
  GET_REACT_ROLES_BY_CATEGORY_ID,
} from '../../src/database/queries/reactRole.query';
import { requiredPermissions } from '../../utilities/utilErrorMessages';
import { setTimeout } from 'node:timers/promises';
import { Category, ReactRole } from '../../src/database/entities';
import { handleAutocompleteCategory } from '../../utilities/utilAutocomplete';
import { GET_GUILD_CONFIG } from '../../src/database/queries/guild.query';
import { GuildReactType } from '../../src/database/entities/guild.entity';
import { ActionRowBuilder } from '@discordjs/builders';

export class ReactChannelCommand extends SlashCommand {
  constructor() {
    super(
      'react-channel',
      'Send all categories or one with react roles to the selected channel.',
      CommandCategory.react,
      [PermissionsBitField.Flags.ManageRoles]
    );

    this.addChannelOption(
      'channel',
      'The channel that will receive reaction roles.',
      true
    );

    this.addStringOption(
      'category-name',
      'Send only a single category to the channel.',
      false,
      [],
      true
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
    categoryId: number
  ) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const channel = this.expect(interaction.options.getChannel('channel'), {
      message: `Hey! I can't find the channel! Please wait and try again.`,
      prop: 'channel',
    });

    if (channel.type !== ChannelType.GuildText) {
      this.log.error(`Passed in channel was invalid.`, interaction.guildId);

      return interaction
        .editReply(`Hey! I only support sending embeds to text channels!`)
        .catch((e) =>
          this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
        );
    }

    const textChannel = this.expect(
      await interaction.guild?.channels.fetch(channel.id),
      {
        message: `Failed to find the channel just passed in!`,
        prop: 'text channel',
      }
    );

    if (textChannel.type !== ChannelType.GuildText) return;

    const category = this.expect(await GET_CATEGORY_BY_ID(categoryId), {
      message: `I failed to find the category! Please wait and try again.`,
      prop: 'category',
    });

    const roles = await GET_REACT_ROLES_BY_CATEGORY_ID(
      category.id,
      category.displayOrder
    );
    if (!roles.length) return;

    return this.messageChannelAndReact(
      interaction,
      textChannel,
      category,
      roles
    );
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const { guildId } = interaction;

    // Defer because of Discord rate limits.
    await interaction.deferReply({
      ephemeral: true,
    });

    /**
     * If the user passed in a category we don't need to waste time here.
     */
    const categoryId = interaction.options.getString('category-name');

    if (categoryId && !isNaN(Number(categoryId))) {
      return this.handleSingleCategory(interaction, Number(categoryId));
    } else if (categoryId) {
      return interaction.editReply(
        `Hey! You need to wait for options to show before hitting enter. You entered "${categoryId}" which isn't a category here.`
      );
    }

    const categories = await GET_GUILD_CATEGORIES(guildId).catch((e) =>
      this.log.error(`Failed to get categories\n${e}`, guildId)
    );

    if (!categories) {
      this.log.debug(`Guild has no categories.`, guildId);

      return interaction.editReply(
        `Hey! You need to make some categories and fill them with react roles before running this command. Check out \`/category-add\`.`
      );
    }

    // Stolen from @react/message execute function
    const allCategoriesAreEmpty = `Hey! It appears all your categories are empty. I can't react to the message you want if you have at least one react role in at least one category. Check out \`/category-add\` to start adding roles to a category.`;
    const categoryRolesCount = await GET_GUILD_CATEGORY_ROLE_COUNT(guildId);

    if (!categoryRolesCount) {
      this.log.debug(
        `Guild has categories but all of them are empty.`,
        guildId
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
        guildId
      );

      return interaction.editReply(
        `Hey! I only support sending embeds to text channels!`
      );
    }

    const textChannel = await interaction.guild?.channels.fetch(channel.id);
    if (textChannel?.type !== ChannelType.GuildText) return;

    for (const category of categories) {
      const roles = await GET_REACT_ROLES_BY_CATEGORY_ID(
        category.id,
        category.displayOrder
      );
      if (!roles.length) continue;

      await this.messageChannelAndReact(
        interaction,
        textChannel,
        category,
        roles
      );

      await setTimeout(1000);
    }
  };

  private reactRoleButtons = (reactRoles: ReactRole[], hideEmojis: boolean) => {
    const customId = (r: ReactRole) => `react-button_${r.id}-${r.categoryId}`;
    const buildButton = (r: ReactRole) => {
      const button = new ButtonBuilder()
        .setCustomId(customId(r))
        .setLabel(r.name)
        .setStyle(ButtonStyle.Secondary);

      if (hideEmojis) {
        return button;
      } else {
        return button.setEmoji(r.emojiId);
      }
    };

    return spliceIntoChunks(reactRoles, 5).map((roles) =>
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        roles.map(buildButton)
      )
    );
  };

  private messageChannelAndReact = async (
    interaction: ChatInputCommandInteraction,
    channel: TextChannel,
    category: Category,
    roles: ReactRole[]
  ) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }
    const config = await GET_GUILD_CONFIG(interaction.guildId);

    let embed = undefined;
    const buttons = [];

    switch (config?.reactType) {
      case GuildReactType.button:
        embed = EmbedService.reactRoleEmbed(roles, category, config.hideEmojis);
        buttons.push(...this.reactRoleButtons(roles, config.hideEmojis));
        break;
      case GuildReactType.select:
        // @TODO - Handle select dropdown in future.
        embed = EmbedService.reactRoleEmbed(roles, category);
        break;
      case GuildReactType.reaction:
      default:
        embed = EmbedService.reactRoleEmbed(roles, category);
    }

    const permissionError = requiredPermissions(channel.id);

    try {
      const message = await channel.send({
        embeds: [embed],
        components: buttons,
      });

      if (config?.reactType !== GuildReactType.button) {
        const isSuccessfulReacting = await reactToMessage(
          message,
          interaction.guildId,
          roles,
          channel.id,
          category.id,
          false,
          this.log
        );

        if (!isSuccessfulReacting) {
          await message.delete();

          return interaction.editReply(permissionError);
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
