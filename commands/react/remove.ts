import { CommandInteraction, Permissions } from 'discord.js';
import RoleBot from '../../src/bot';
import {
  DELETE_REACT_ROLE_BY_ROLE_ID,
  GET_REACT_ROLE_BY_ROLE_ID,
} from '../../src/database/database';
import { LogService } from '../../src/services/logService';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class ReactDeleteCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'react-delete',
      'Delete an existing reaction role from a drop down menu.',
      Category.react,
      [Permissions.FLAGS.MANAGE_ROLES]
    );

    this.addRoleOption('role', `The reaction role you want to delete.`, true);
  }

  execute = async (interaction: CommandInteraction) => {
    const role = interaction.options.get('role')?.role;

    if (!role) {
      LogService.error(
        `Interaction was missing role property despite it being required.`
      );

      return interaction.reply({
        ephemeral: true,
        content: `Hey! For some reason I was unable to get the role that you told me to delete. Is it already deleted? Please try again. :)`,
      });
    }

    const reactRole = await GET_REACT_ROLE_BY_ROLE_ID(role.id);

    if (!reactRole) {
      LogService.debug(
        `User passed in role[${role.id}] that isn't in guilds reactRoles list.`
      );

      return interaction.reply({
        ephemeral: true,
        content: `Hey! That role isn't in my system, perhaps you meant to pass in a different role?`,
      });
    }

    DELETE_REACT_ROLE_BY_ROLE_ID(role.id)
      .then(() => {
        LogService.debug(
          `Successfully removed guilds[${interaction.guildId}] react role[${role.id}]`
        );

        interaction.reply({
          ephemeral: true,
          content: `I successfully removed that react role! You can add it back at any time if you wish.`,
        });
      })
      .catch((e) => {
        LogService.error(
          `Error'd when trying to delete react role[${role.id}] on guild[${interaction.guildId}]\n\t\t${e}`
        );

        interaction.reply({
          ephemeral: true,
          content: `Hey! I had an issue deleting that react role. Please wait a moment and try again.`,
        });
      });
  };
}
