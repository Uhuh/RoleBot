import {
  AutocompleteInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  PermissionsBitField,
  TextChannel,
} from 'discord.js';

import { EmbedService } from '../../src/services/embedService';
import { reactToMessage } from '../../utilities/utils';
import { Category as CommandCategory } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import {
  GET_CATEGORY_BY_ID,
  GET_GUILD_CATEGORIES,
} from '../../src/database/queries/category.query';
import { GET_REACT_ROLES_BY_CATEGORY_ID } from '../../src/database/queries/reactRole.query';
import { requiredPermissions } from '../../utilities/utilErrorMessages';
import { setTimeout } from 'node:timers/promises';
import { Category, ReactRole } from '../../src/database/entities';
import { handleAutocompleteCategory } from '../../utilities/utilAutocomplete';

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

    const roles = await GET_REACT_ROLES_BY_CATEGORY_ID(category.id);
    if (!roles.length) return;

    return this.messageChannelAndReact(
      interaction,
      textChannel,
      category,
      roles
    );
  };

  public execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

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

    const categories = await GET_GUILD_CATEGORIES(interaction.guildId).catch(
      (e) =>
        this.log.error(`Failed to get categories\n${e}`, interaction.guildId)
    );

    if (!categories) {
      this.log.debug(`Guild has no categories.`, interaction.guildId);

      return interaction.editReply(
        `Hey! You need to make some categories and fill them with react roles before running this command. Check out \`/category-add\`.`
      );
    }

    // Stolen from @react/message execute function
    const allCategoriesAreEmpty = `Hey! It appears all your categories are empty. I can't react to the message you want if you have at least one react role in at least one category. Check out \`/category-add\` to start adding roles to a category.`;
    const categoryRoles = await Promise.all(
      categories.map((c) => GET_REACT_ROLES_BY_CATEGORY_ID(c.id))
    );

    // Presumably, if all the array of roles for each category is length 0 then this being 0 is "false"
    const allEmptyCategories = categoryRoles.filter((r) => r.length).length;

    if (!allEmptyCategories) {
      this.log.debug(
        `Guild has categories but all of them are empty.`,
        interaction.guildId
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
        interaction.guildId
      );

      return interaction.editReply(
        `Hey! I only support sending embeds to text channels!`
      );
    }

    const textChannel = await interaction.guild?.channels.fetch(channel.id);
    if (textChannel?.type !== ChannelType.GuildText) return;

    for (const category of categories) {
      const roles = await GET_REACT_ROLES_BY_CATEGORY_ID(category.id);
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

  private messageChannelAndReact = async (
    interaction: ChatInputCommandInteraction,
    channel: TextChannel,
    category: Category,
    roles: ReactRole[]
  ) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const embed = EmbedService.reactRoleEmbed(roles, category);
    const permissionError = requiredPermissions(channel.id);

    try {
      const message = await channel.send({
        embeds: [embed],
      });

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
    } catch (e) {
      this.log.error(`Failed to send embeds.\n${e}`, interaction.guildId);

      return interaction.editReply(permissionError);
    }

    await interaction.editReply({
      content: 'Hey! I successfully sent the embeds and reacted to them!',
    });
  };
}
