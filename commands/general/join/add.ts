import { ApplicationCommandOptionType, ChatInputCommandInteraction } from 'discord.js';
import {
  CREATE_JOIN_ROLE,
  GET_GUILD_JOIN_ROLES,
  GET_JOIN_ROLE_BY_ID,
} from '../../../src/database/queries/joinRole.query';
import { RolePing } from '../../../utilities/utilPings';
import { SlashSubCommand } from '../../command';

const enum CommandOptionNames {
  Role = 'role'
}

export class AddSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(baseCommand, 'add', 'A role users will obtain when joining.', [
      {
        name: CommandOptionNames.Role,
        description: 'User will get this role when joining.',
        required: true,
        type: ApplicationCommandOptionType.Role,
      },
    ]);
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) return;

    await interaction.deferReply({
      ephemeral: true,
    });

    const role = this.expect(interaction.options.getRole(CommandOptionNames.Role), {
      message: 'Could not find the role you passed.',
      prop: CommandOptionNames.Role,
    });

    const numJoinRoles = (await GET_GUILD_JOIN_ROLES(interaction.guildId))
      .length;

    const doesRoleExist = await GET_JOIN_ROLE_BY_ID(role.id);

    if (doesRoleExist.length) {
      return interaction.editReply(
        `Hey! That role is already in your auto-join list. Use \`/auto-join list\` to see what roles are in that list.`,
      );
    }

    if (numJoinRoles < 5) {
      try {
        await CREATE_JOIN_ROLE(role.name, role.id, interaction.guildId);

        return interaction.editReply(
          `:tada: I successfully added ${RolePing(
            role.id,
          )} to the auto-join list.`,
        );
      } catch (e) {
        return interaction.editReply(
          `Hey! I had an issue adding that role to the servers auto-join list.`,
        );
      }
    } else {
      return interaction.editReply(
        `Hey! Currently RoleBot doesn't support having more than 5 auto-join roles.`,
      );
    }
  };
}
