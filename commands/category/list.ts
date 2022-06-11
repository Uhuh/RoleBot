import {
  CommandInteraction,
  MessageEmbed,
  Permissions,
} from 'discord.js-light';
import {
  GET_GUILD_CATEGORIES,
  GET_REACT_ROLES_NOT_IN_CATEGORIES,
} from '../../src/database/database';
import { SlashCommand } from '../slashCommand';
import { EmbedService } from '../../src/services/embedService';
import { Category } from '../../utilities/types/commands';
import RoleBot from '../../src/bot';
import { handleInteractionReply, spliceIntoChunks } from '../../utilities/utils';

export class ListCategoryCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'category-list',
      'List all your categories and the roles within them.',
      Category.category,
      [Permissions.FLAGS.MANAGE_ROLES]
    );
  }

  execute = async (interaction: CommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    const categories = await GET_GUILD_CATEGORIES(interaction.guildId).catch(
      (e) =>
        this.log.error(
          `Failed to get categories for guild[${interaction.guildId}]\n${e}`
        )
    );

    if (!categories || !categories.length) {
      this.log.info(
        `Guild[${interaction.guildId}] did not have any categories.`
      );

      return handleInteractionReply(this.log, interaction, `Hey! It appears that there aren't any categories for this server... however, if there ARE supposed to be some and you see this please wait a second and try again.`);
    }

    handleInteractionReply(this.log, interaction, `Hey! Let me build these embeds for you real quick and send them...`);

    const embeds: MessageEmbed[] = [];

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
            `Failed to send category embeds to channel[${interaction.channel?.id}] in guild[${interaction.guildId}]`
          )
        );
    }
  };
}
