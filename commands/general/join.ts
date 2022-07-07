import { SlashCommandBuilder } from '@discordjs/builders';
import { APIRole } from 'discord-api-types';
import {
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  Permissions,
  Role,
} from 'discord.js-light';
import RoleBot from '../../src/bot';
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
      [Permissions.FLAGS.MANAGE_ROLES],
      command
    );
  }

  add = (interaction: CommandInteraction, role: APIRole | Role) => {
    console.log('add');
    handleInteractionReply(this.log, interaction, {
      ephemeral: true,
      content: `Auto add`,
    });
  };

  remove = (interaction: CommandInteraction, role: APIRole | Role) => {
    console.log('remove');
    handleInteractionReply(this.log, interaction, {
      ephemeral: true,
      content: `Auto remove`,
    });
  };

  list = (interaction: CommandInteraction) => {
    console.log('list');
    handleInteractionReply(this.log, interaction, {
      ephemeral: true,
      content: `Auto list`,
    });
  };

  execute = async (interaction: CommandInteraction) => {
    if (!interaction.guildId) return;

    const subCommandName = interaction.options.getSubcommand();
    const subCommandOptions = interaction.options.data;
    let role: APIRole | Role | undefined | null;

    //
    if (
      subCommandOptions[0].options &&
      subCommandOptions[0].options[0].options
    ) {
      const optionName = subCommandOptions[0].options[0].options[0].name;
      role = interaction.options.get(optionName)?.role;
      console.log(optionName);

      if (role === undefined || role === null) {
        return handleInteractionReply(this.log, interaction, {
          ephemeral: true,
          content: `Hey! I couldn't find the role for some reason. If this continues please join the support server.`,
        });
      }

      const isValidPosition = await isValidRolePosition(interaction, role);

      if (!isValidPosition) {
        const embed = new MessageEmbed()
          .setTitle('Reaction Roles Setup')
          .setDescription(
            `The role <@&${role.id}> is above me in the role list which you can find in \`Server settings > Roles\`.
            \nPlease make sure that my role \`RoleBot\` is higher than the roles you give me in your servers role hierarchy.`
          );

        const button = new MessageActionRow().addComponents(
          new MessageButton()
            .setLabel('Discord Roles')
            .setURL(
              'https://support.discord.com/hc/en-us/articles/214836687-Role-Management-101'
            )
            .setStyle('LINK')
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
