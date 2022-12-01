import { ChatInputCommandInteraction } from 'discord.js';
import {
  DELETE_REACT_ROLE_BY_ROLE_ID,
  GET_REACT_ROLES_BY_GUILD,
} from '../../src/database/queries/reactRole.query';
import { SlashSubCommand } from '../command';

export class CleanSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(
      baseCommand,
      'clean',
      `If you delete a role RoleBot might miss it, this will remove '@deleted' roles.`
    );
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    let numRemovedRoles = 0;

    try {
      const reactRoles = await GET_REACT_ROLES_BY_GUILD(interaction.guildId);
      const nonCachedRoles = reactRoles.filter(
        (r) => !interaction.guild?.roles.cache.has(r.roleId)
      );

      for (const role of nonCachedRoles) {
        const fetchedRole = await interaction.guild?.roles.fetch(role.roleId);
        if (!fetchedRole) {
          this.log.debug(`Purging old react role[${role.roleId}]`);
          await DELETE_REACT_ROLE_BY_ROLE_ID(role.roleId);
          numRemovedRoles++;
        }
      }
    } catch (e) {
      return this.log.error(`Failed to filter old.\n${e}`, interaction.guildId);
    }

    const reply = numRemovedRoles
      ? `Removed ${numRemovedRoles} dead react roles.`
      : 'There are no dead react roles.';

    return interaction.editReply(reply);
  };
}
