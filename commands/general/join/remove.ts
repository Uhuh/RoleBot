import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js';
import {
  DELETE_JOIN_ROLE,
  GET_JOIN_ROLE_BY_ID,
} from '../../../src/database/queries/joinRole.query';
import { SlashSubCommand } from '../../command';

const enum CommandOptionNames {
  Role = 'role',
}

export class RemoveSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(baseCommand, 'remove', 'Remove an auto join role from the list.', [
      {
        name: CommandOptionNames.Role,
        description: 'The role to remove.',
        required: true,
        type: ApplicationCommandOptionType.Role,
      },
    ]);
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply({
      ephemeral: true,
    });

    const role = this.expect(interaction.options.getRole(CommandOptionNames.Role), {
      message: 'Could not find the role you passed.',
      prop: 'role',
    });

    const doesRoleExist = await GET_JOIN_ROLE_BY_ID(role.id);

    // If the role isn't in the database then no point in trying to remove.
    if (!doesRoleExist) {
      return interaction.editReply(
        `That role wasn't found in the auto-join list so nothing was removed.`
      );
    }

    try {
      await DELETE_JOIN_ROLE(role.id);

      return interaction.editReply(
        `Hey! I successfully removed the role from the auto-join list.`
      );
    } catch (e) {
      this.log.error(
        `Failed to remove auto-join role[${role.id}]`,
        interaction.guildId
      );

      return interaction.editReply(
        `Hey! I'm having trouble removing that role from the auto-join list.\nIt may be worth joining the support server and reporting this.`
      );
    }
  };
}
