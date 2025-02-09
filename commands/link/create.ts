import { SlashSubCommand } from '../command';
import {
  APIRole,
  ApplicationCommandOptionType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  MessageFlags,
  Role,
} from 'discord.js';
import { handleAutocompleteReactRoles } from '../../utilities/utilAutocomplete';
import { CREATE_LINKED_ROLES, FIND_ROLE_IN_LINK } from '../../src/database/queries/link.query';
import { ReactRole } from '../../src/database/entities';
import { GET_REACT_ROLE_BY_ID } from '../../src/database/queries/reactRole.query';

const enum CommandOptionsNames {
  ReactRole = 'react-role',
  Role = 'roles',
}

export class CreateSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(
      baseCommand,
      'create',
      'Create a link of roles for an existing react role.',
      [
        {
          name: CommandOptionsNames.ReactRole,
          description: 'The react role to link to.',
          type: ApplicationCommandOptionType.String,
          autocomplete: true,
          required: true,
        },
        {
          name: CommandOptionsNames.Role,
          description: 'The role to link with.',
          type: ApplicationCommandOptionType.Role,
          required: true,
        },
      ],
    );
  }

  handleAutoComplete = async (interaction: AutocompleteInteraction) => {
    try {
      await handleAutocompleteReactRoles(interaction);
    } catch (e) {
      this.log.error(`Failed to get categories for autocomplete.\n${e}`);

      await interaction.respond([
        { name: `SHOULD NOT SEE THIS! :)`, value: 'oopsies!' },
      ]);
    }
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    const reactRoleId = this.expect(interaction.options.getString(CommandOptionsNames.ReactRole), {
      message: 'Failed to find that react role! Try again.',
      prop: CommandOptionsNames.ReactRole,
    });

    const reactRole = await GET_REACT_ROLE_BY_ID(Number(reactRoleId));

    // Make sure the slash command didn't return garbage.
    if (!reactRole) {
      this.log.error(`React role ID was not a number: ${reactRoleId}`, interaction.guildId);

      return interaction.editReply(`Hey! I failed to get the react role.`);
    }

    const role = this.expect(interaction.options.getRole(CommandOptionsNames.Role), {
      message: 'Failed to find that role! Try again.',
      prop: CommandOptionsNames.Role,
    });

    if (role.managed) {
      return interaction.editReply(`Hey! ${role} is a managed role for another application, try another role!`);
    }

    const isRoleInLink = await FIND_ROLE_IN_LINK(reactRole.id, role.id);

    if (isRoleInLink) {
      return interaction.editReply(`Hey! ${role} is already linked to this react role.`);
    }

    return this.createLinkedRoles(interaction, reactRole, role);
  };

  private async createLinkedRoles(interaction: ChatInputCommandInteraction, reactRole: ReactRole, role: Role | APIRole) {
    const { guildId } = interaction;

    // Should've been verified in execute
    if (!guildId) return;

    await CREATE_LINKED_ROLES(guildId, role.id, reactRole);

    return interaction.editReply(`Successfully linked ${role} to the react role \`${reactRole.name}\``);
  }
}