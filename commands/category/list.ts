import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { GET_GUILD_CATEGORIES } from '../../src/database/queries/category.query';
import { GET_REACT_ROLES_NOT_IN_CATEGORIES } from '../../src/database/queries/reactRole.query';
import { spliceIntoChunks } from '../../utilities/utils';
import { SlashSubCommand } from '../command';
import { setTimeout } from 'node:timers/promises';
import { categoryReactRoleEmbed, freeReactRoles } from '../../utilities/utilEmbedHelpers';

export class ListSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(
      baseCommand,
      'list',
      'List all your categories and the roles within them.'
    );
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    const categories = await GET_GUILD_CATEGORIES(interaction.guildId).catch(
      (e) =>
        this.log.error(`Failed to get categories\n${e}`, interaction.guildId)
    );

    if (!categories || !categories.length) {
      this.log.info(`Guild has no categories.`, interaction.guildId);

      return interaction.editReply(
        `Hey! It appears that there aren't any categories for this server... however, if there ARE supposed to be some and you see this please wait a second and try again.`
      );
    }

    await interaction.editReply(
      `Hey! Let me build those embeds for you.\n\nIf you notice any react roles that have deleted roles run \`/react clean\` to remove them.`
    );

    const embeds: EmbedBuilder[] = [];

    // Let's show the user the free react roles and encourage them to add them to a category.
    const rolesNotInCategory = await GET_REACT_ROLES_NOT_IN_CATEGORIES(
      interaction.guildId
    );

    if (rolesNotInCategory.length) {
      embeds.push(await freeReactRoles(rolesNotInCategory));
    }

    for (const cat of categories) {
      embeds.push(await categoryReactRoleEmbed(cat));
    }

    for (const chunk of spliceIntoChunks(embeds, 10)) {
      await interaction.followUp({
        ephemeral: true,
        embeds: chunk,
      });

      await setTimeout(1000);
    }
  };
}
