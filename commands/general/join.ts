import { SlashCommandBuilder } from '@discordjs/builders';
import {
  ActionRowBuilder,
  APIRole,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionsBitField,
  Role,
} from 'discord.js';
import {
  CREATE_JOIN_ROLE,
  DELETE_JOIN_ROLE,
  GET_GUILD_JOIN_ROLES,
  GET_GUILD_JOIN_ROLES_COUNT,
  GET_JOIN_ROLE_BY_ID,
} from '../../src/database/queries/joinRole.query';
import { EmbedService } from '../../src/services/embedService';
import { Category } from '../../utilities/types/commands';
import { RolePing } from '../../utilities/utilPings';
import {
  handleInteractionReply,
  isValidRolePosition,
} from '../../utilities/utils';
import { SlashCommand } from '../slashCommand';
import * as i18n from 'i18n';

export class AutoJoinCommand extends SlashCommand {
  constructor() {
    /**
     * Since making subcommand groups is currently awkward here is the workaround.
     * @TODO - Change the parent SlashCommand system to better accomodate for this besides the "override" command.
     */
    const commandName = 'auto-join';
    const commandDescription = 'Setup auto join roles for the server.';
    const command = new SlashCommandBuilder()
      .setName(commandName)
      .setDescription(commandDescription)
      .addSubcommandGroup((subCommandGroup) =>
        subCommandGroup
          .setName('role')
          .setDescription('Add, remove or list all your auto-join roles.')
          .addSubcommand((command) =>
            command
              .setName('add')
              .setDescription('Add a role to your auto-join roles.')
              .addRoleOption((option) =>
                option
                  .setName('add-role')
                  .setDescription(
                    'Users will get this role when they join your server.'
                  )
                  .setRequired(true)
              )
          )
          .addSubcommand((command) =>
            command
              .setName('remove')
              .setDescription('Remove an auto join role from your list.')
              .addRoleOption((option) =>
                option
                  .setName('remove-join')
                  .setDescription('The auto join role you wish to remove.')
                  .setRequired(true)
              )
          )
          .addSubcommand((command) =>
            command
              .setName('list')
              .setDescription('See all your auto join roles.')
          )
      );

    super(
      commandName,
      commandDescription,
      Category.general,
      [PermissionsBitField.Flags.ManageRoles],
      command
    );
  }

  add = async (
    interaction: ChatInputCommandInteraction,
    role: Role | APIRole
  ) => {
    if (!interaction.guildId) return;

    const { guildId } = interaction;

    const numJoinRoles = await GET_GUILD_JOIN_ROLES_COUNT(guildId);

    const doesRoleExist = await GET_JOIN_ROLE_BY_ID(role.id);

    if (doesRoleExist.length) {
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: i18n.__('GENERAL.JOIN.ADD.EXIST'),
      });
    }

    if (numJoinRoles < 5) {
      try {
        await CREATE_JOIN_ROLE(role.name, role.id, guildId);

        return interaction.reply({
          ephemeral: true,
          content: i18n.__('GENERAL.JOIN.ADD.SUCCESS', {
            role: RolePing(role.id),
          }),
        });
      } catch (e) {
        return interaction.reply({
          ephemeral: true,
          content: i18n.__('GENERAL.JOIN.ADD.FAILED'),
        });
      }
    } else {
      return interaction.reply({
        ephemeral: true,
        content: i18n.__('GENERAL.JOIN.ADD.TOO_MANY'),
      });
    }
  };

  remove = async (
    interaction: ChatInputCommandInteraction,
    role: Role | APIRole
  ) => {
    const doesRoleExist = await GET_JOIN_ROLE_BY_ID(role.id);

    // If the role isn't in the database then no point in trying to remove.
    if (!doesRoleExist) {
      return interaction.reply({
        ephemeral: true,
        content: i18n.__('GENERAL.JOIN.REMOVE.DOES_NOT_EXIST'),
      });
    }

    try {
      await DELETE_JOIN_ROLE(role.id);

      return interaction.reply({
        ephemeral: true,
        content: i18n.__('GENERAL.JOIN.REMOVE.SUCCESS'),
      });
    } catch (e) {
      this.log.error(
        `Failed to remove auto-join role[${role.id}]`,
        interaction.guildId
      );

      return interaction.reply({
        ephemeral: true,
        content: i18n.__('GENERAL.JOIN.REMOVE.FAILED'),
      });
    }
  };

  list = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) return;

    const joinRoles = await GET_GUILD_JOIN_ROLES(interaction.guildId);

    const embed = EmbedService.joinRoleEmbed(joinRoles.map((r) => r.roleId));

    return interaction.reply({
      ephemeral: true,
      embeds: [embed],
    });
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) return;

    const addRole = interaction.options.getRole('add-role');
    const removeRole = interaction.options.getRole('remove-join');

    if (!addRole && !removeRole) {
      return this.list(interaction);
    } else if (addRole) {
      const isValidPosition = await isValidRolePosition(interaction, addRole);

      if (!isValidPosition) {
        const embed = new EmbedBuilder()
          .setTitle(i18n.__('GENERAL.JOIN.INVALID_TITLE'))
          .setDescription(
            i18n.__('GENERAL.JOIN.INVALID_DESCRIPTION', {
              role: RolePing(addRole.id),
            })
          );

        const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('Discord Roles')
            .setURL(
              'https://support.discord.com/hc/en-us/articles/214836687-Role-Management-101'
            )
            .setStyle(ButtonStyle.Link)
        );

        return interaction.reply({
          ephemeral: true,
          embeds: [embed],
          components: [button],
        });
      }

      return this.add(interaction, addRole);
    } else if (removeRole) {
      return this.remove(interaction, removeRole);
    }
  };
}
