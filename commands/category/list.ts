import { CommandInteraction, MessageEmbed, Permissions } from 'discord.js';
import { GET_GUILD_CATEGORIES } from '../../src/database/database';
import { SlashCommand } from '../slashCommand';
import { EmbedService } from '../../src/services/embedService';
import { Category } from '../../utilities/types/commands';
import RoleBot from '../../src/bot';

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
      (e) => {
        this.log.error(
          `Failed to get categories for guild[${interaction.guildId}]`
        );
        this.log.error(e);
      }
    );

    if (!categories || !categories.length) {
      this.log.debug(
        `Guild[${interaction.guildId}] did not have any categories.`
      );

      return interaction
        .reply(
          `Hey! It appears that there aren't any categories for this server... however, if there ARE supposed to be some and you see this please wait a second and try again.`
        )
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    interaction
      .reply(
        `Hey! Let me build these embeds for you real quick and send them...`
      )
      .catch((e) => {
        this.log.error(`Interaction failed.`);
        this.log.error(`${e}`);
      });

    const embeds: MessageEmbed[] = [];

    for (const cat of categories) {
      embeds.push(await EmbedService.categoryReactRoleEmbed(cat, this.client));
    }

    interaction.channel?.send({
      content: `And here they are!`,
      embeds,
    });
  };
}
