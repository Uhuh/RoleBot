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
import RoleBot from '../../src/bot';
import {
  CREATE_JOIN_ROLE,
  DELETE_JOIN_ROLE,
  GET_GUILD_JOIN_ROLES,
  GET_JOIN_ROLE_BY_ID,
} from '../../src/database/queries/joinRole.query';
import { EmbedService } from '../../src/services/embedService';
import { Category } from '../../utilities/types/commands';
import {
  handleInteractionReply,
  isValidRolePosition,
} from '../../utilities/utils';
import { SlashCommand } from '../slashCommand';

export class AutoJoinCommand extends SlashCommand {
  constructor(client: RoleBot) {
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
      client,
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

    const numJoinRoles = (await GET_GUILD_JOIN_ROLES(interaction.guildId))
      .length;

    const doesRoleExist = await GET_JOIN_ROLE_BY_ID(role.id);

    if (doesRoleExist.length) {
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! That role is already in your auto-join list. Use \`/auto-join list\` to see what roles are in that list.`,
      });
    }

    if (numJoinRoles < 5) {
      try {
        await CREATE_JOIN_ROLE(role.name, role.id, interaction.guildId);

        handleInteractionReply(this.log, interaction, {
          ephemeral: true,
          content: `:tada: I successfully added <@&${role.id}> to the auto-join list.`,
        });
      } catch (e) {
        handleInteractionReply(this.log, interaction, {
          ephemeral: true,
          content: `Hey! I had an issue adding that role to the servers auto-join list.`,
        });
      }
    } else {
      handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! Currently RoleBot doesn't support having more than 5 auto-join roles.`,
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
      return handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `That role wasn't found in the auto-join list so nothing was removed.`,
      });
    }

    try {
      await DELETE_JOIN_ROLE(role.id);

      handleInteractionReply(
        this.log,
        interaction,
        `Hey! I successfully removed the role from the auto-join list.`
      );
    } catch (e) {
      this.log.error(
        `Failed to remove auto-join role[${role.id}]`,
        interaction.guildId
      );
      handleInteractionReply(this.log, interaction, {
        ephemeral: true,
        content: `Hey! I'm having trouble removing that role from the auto-join list.\nIt may be worth joining the support server and reporting this.`,
      });
    }
  };

  list = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) return;

    const joinRoles = await GET_GUILD_JOIN_ROLES(interaction.guildId);

    const embed = EmbedService.joinRoleEmbed(joinRoles.map((r) => r.roleId));

    interaction
      .reply({
        ephemeral: true,
        embeds: [embed],
      })
      .catch(() => {
        handleInteractionReply(this.log, interaction, {
          ephemeral: true,
          content: `Hey! I had an issue sending the embed.`,
        });
      });
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) return;

    const subCommandName = interaction.options.getSubcommand();
    const subCommandOptions = interaction.options.data;
    let role: Role | APIRole | undefined | null;

    // Check if the subcommand has options, if it does then it might be add/remove and we can get the role the user passed
    if (
      subCommandOptions[0].options &&
      subCommandOptions[0].options[0].options?.length
    ) {
      const optionName = subCommandOptions[0].options[0].options[0].name;
      role = interaction.options.get(optionName)?.role;

      if (role === undefined || role === null) {
        return handleInteractionReply(this.log, interaction, {
          ephemeral: true,
          content: `Hey! I couldn't find the role for some reason. If this continues please join the support server.`,
        });
      }

      const isValidPosition = await isValidRolePosition(interaction, role);

      if (!isValidPosition) {
        const embed = new EmbedBuilder()
          .setTitle('Reaction Roles Setup')
          .setDescription(
            `The role <@&${role.id}> is above me in the role list which you can find in \`Server settings > Roles\`.
            \nPlease make sure that my role \`RoleBot\` is higher than the roles you give me in your servers role hierarchy.`
          );

        const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel('Discord Roles')
            .setURL(
              'https://support.discord.com/hc/en-us/articles/214836687-Role-Management-101'
            )
            .setStyle(ButtonStyle.Link)
        );

        return interaction
          .reply({
            ephemeral: true,
            embeds: [embed],
            components: [button],
          })
          .catch((e) =>
            this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
          );
      }
    }

    switch (subCommandName) {
      case 'add':
        // If we somehow get into this with a null role and the above checks failed.
        if (!role) return;
        this.add(interaction, role);
        break;
      case 'remove':
        // If we somehow get into this with a null role and the above checks failed.
        if (!role) return;
        this.remove(interaction, role);
        break;
      case 'list':
        this.list(interaction);
        break;
      default:
        handleInteractionReply(this.log, interaction, {
          content: `Hey! I had an issue parsing my own command. Do I have a sub command labelled as ${subCommandName}?`,
        });
    }
  };
}
