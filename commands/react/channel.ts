import {
  AutocompleteInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from 'discord.js';

import { EmbedService } from '../../src/services/embedService';
import { reactToMessage } from '../../utilities/utils';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import {
  GET_CATEGORY_BY_ID,
  GET_GUILD_CATEGORIES,
} from '../../src/database/queries/category.query';
import { GET_REACT_ROLES_BY_CATEGORY_ID } from '../../src/database/queries/reactRole.query';
import { requiredPermissions } from '../../utilities/utilErrorMessages';
import { isCategoryNull } from '../../utilities/utilIsNull';

export class ReactChannelCommand extends SlashCommand {
  constructor() {
    super(
      'react-channel',
      'Send all categories or one with react roles to the selected channel.',
      Category.react,
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
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const categories = await GET_GUILD_CATEGORIES(interaction.guildId);

    const focusedValue = interaction.options.getFocused();
    const filtered = categories.filter((c) => c.name.startsWith(focusedValue));

    await interaction
      .respond(filtered.map((c) => ({ name: c.name, value: `${c.id}` })))
      .catch((e) => this.log.error(`Failed to respond to interaction.\n${e}`));
  };

  handleSingleCategory = async (
    interaction: ChatInputCommandInteraction,
    categoryId: number
  ) => {
    const channel = interaction.options.getChannel('channel');

    if (!channel || channel.type !== ChannelType.GuildText) {
      this.log.error(`Passed in channel was invalid.`, interaction.guildId);

      return interaction
        .editReply(`Hey! I only support sending embeds to text channels!`)
        .catch((e) =>
          this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
        );
    }

    const category = await GET_CATEGORY_BY_ID(categoryId);

    if (isCategoryNull(interaction, category, categoryId)) return;
  };

  public execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    try {
      // Defer because of Discord rate limits.
      await interaction
        .deferReply({
          ephemeral: true,
        })
        .catch((e) =>
          this.log.error(
            `Failed to defer interaction and the try/catch didn't catch it.\n${e}`,
            interaction.guildId
          )
        );
    } catch (e) {
      this.log.error(`Failed to defer interaction.\n${e}`, interaction.guildId);
      return;
    }

    /**
     * If the user passed in a category we don't need to waste time here.
     */
    const categoryId = interaction.options.getString('category-name');

    if (categoryId) {
      return this.handleSingleCategory(interaction, Number(categoryId));
    }

    const categories = await GET_GUILD_CATEGORIES(interaction.guildId).catch(
      (e) =>
        this.log.error(`Failed to get categories\n${e}`, interaction.guildId)
    );

    if (!categories) {
      this.log.debug(`Guild has no categories.`, interaction.guildId);

      return interaction
        .editReply(
          `Hey! You need to make some categories and fill them with react roles before running this command. Check out \`/category-add\`.`
        )
        .catch((e) =>
          this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
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

      return interaction
        .editReply({
          content: allCategoriesAreEmpty,
        })
        .catch((e) =>
          this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
        );
    }

    const channel = interaction.options.getChannel('channel');

    if (!channel) {
      this.log.info(
        `Could not find channel on interaction.`,
        interaction.guildId
      );

      return interaction
        .editReply(
          `Hey! I failed to find the channel from the command. Please wait a second and try again.`
        )
        .catch((e) =>
          this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
        );
    } else if (!(channel?.type === ChannelType.GuildText)) {
      this.log.error(
        `Passed in channel[${channel.id}] was not a text channel`,
        interaction.guildId
      );

      return interaction
        .editReply(`Hey! I only support sending embeds to text channels!`)
        .catch((e) =>
          this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
        );
    }

    /* There might be a better solution to this. Potentially reply first, then update the interaction later. Discord interactions feel so incredibly inconsistent though. So for now force users to WAIT the whole 3 seconds so that Discord doesn't cry. */
    await new Promise((res) => {
      setTimeout(
        () =>
          res(`I have to wait at least 3 seconds before Discord goes crazy.`),
        3000
      );
    });

    const textChannel = await interaction.guild?.channels.fetch(channel.id);
    if (textChannel?.type !== ChannelType.GuildText) return;

    const permissionError = requiredPermissions(channel.id);

    for (const category of categories) {
      const categoryRoles = await GET_REACT_ROLES_BY_CATEGORY_ID(category.id);
      if (!categoryRoles.length) continue;

      const embed = EmbedService.reactRoleEmbed(categoryRoles, category);

      try {
        const reactEmbedMessage = await textChannel.send({
          embeds: [embed],
        });

        const isSuccessfulReacting = await reactToMessage(
          reactEmbedMessage,
          interaction.guildId,
          categoryRoles,
          channel.id,
          category.id,
          false,
          this.log
        );

        if (!isSuccessfulReacting) {
          reactEmbedMessage
            .delete()
            .catch(() =>
              this.log.info(
                `Failed to delete embed message after failing reaction.`
              )
            );

          return interaction.editReply(permissionError);
        }
      } catch (e) {
        this.log.error(`Failed to send embeds.\n${e}`, interaction.guildId);

        return interaction.editReply(permissionError);
      }

      await new Promise((res) => {
        setTimeout(() => res(`Send next category message.`), 1000);
      });
    }

    interaction
      .editReply({
        content: 'Hey! I successfully sent the embeds and reacted to them!',
      })
      .catch((e) =>
        this.log.error(
          `Failed to edit interaction reply.\n${e}`,
          interaction.guildId
        )
      );
  };
}
