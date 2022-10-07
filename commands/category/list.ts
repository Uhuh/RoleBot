import {
  ChatInputCommandInteraction,
  PermissionsBitField,
  EmbedBuilder,
} from 'discord.js';

import { SlashCommand } from '../slashCommand';
import { EmbedService } from '../../src/services/embedService';
import { Category } from '../../utilities/types/commands';
import RoleBot from '../../src/bot';
import { spliceIntoChunks } from '../../utilities/utils';
import { GET_GUILD_CATEGORIES } from '../../src/database/queries/category.query';
import { GET_REACT_ROLES_NOT_IN_CATEGORIES } from '../../src/database/queries/reactRole.query';

export class ListCategoryCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'category-list',
      'List all your categories and the roles within them.',
      Category.category,
      [PermissionsBitField.Flags.ManageRoles]
    );
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
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

    const categories = await GET_GUILD_CATEGORIES(interaction.guildId).catch(
      (e) =>
        this.log.error(`Failed to get categories\n${e}`, interaction.guildId)
    );

    if (!categories || !categories.length) {
      this.log.info(`Guild has no categories.`, interaction.guildId);

      return interaction
        .editReply(
          `Hey! It appears that there aren't any categories for this server... however, if there ARE supposed to be some and you see this please wait a second and try again.`
        )
        .catch((e) =>
          this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
        );
    }

    interaction
      .editReply(
        `Hey! Let me build these embeds for you real quick and send them...`
      )
      .catch((e) =>
        this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
      );

    const embeds: EmbedBuilder[] = [];

    // Let's show the user the free react roles and encourage them to add them to a category.
    const rolesNotInCategory = await GET_REACT_ROLES_NOT_IN_CATEGORIES(
      interaction.guildId
    );

    if (rolesNotInCategory.length) {
      embeds.push(await EmbedService.freeReactRoles(rolesNotInCategory));
    }

    for (const cat of categories) {
      embeds.push(await EmbedService.categoryReactRoleEmbed(cat));
    }

    for (const chunk of spliceIntoChunks(embeds, 10)) {
      interaction.channel
        ?.send({
          embeds: chunk,
        })
        .catch(() =>
          this.log.error(
            `Failed to send category embeds to channel[${interaction.channel?.id}]`,
            interaction.guildId
          )
        );
    }
  };
}
