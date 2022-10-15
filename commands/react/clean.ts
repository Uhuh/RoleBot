import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import {
  DELETE_REACT_ROLE_BY_ROLE_ID,
  GET_REACT_ROLES_BY_GUILD,
} from '../../src/database/queries/reactRole.query';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class ReactCleanCommand extends SlashCommand {
  constructor() {
    super(
      'react-clean',
      `If you delete a role RoleBot might miss it, this will remove '@deleted' roles.`,
      Category.react,
      [PermissionsBitField.Flags.ManageRoles]
    );
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    try {
      await interaction.deferReply({
        ephemeral: true,
      });
    } catch (e) {
      return this.log.error(
        `Failed to defer interaction.\n${e}`,
        interaction.guildId
      );
    }

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
