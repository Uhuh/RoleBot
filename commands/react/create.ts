import { APIRole } from 'discord-api-types';
import {
  CommandInteraction,
  Interaction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  Permissions,
  Role,
} from 'discord.js';
import {
  CREATE_REACT_ROLE,
  GET_REACT_ROLE_BY_EMOJI,
} from '../../src/database/database';
import { LogService } from '../../src/services/logService';
import { CLIENT_ID } from '../../src/vars';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class ReactRoleCommand extends SlashCommand {
  constructor() {
    super(
      'reactionrole',
      'Create a new reaction role. Give the command a role and an emoji. It really is that simple.',
      Category.react,
      [Permissions.FLAGS.MANAGE_ROLES]
    );

    this.addRoleOption('role', 'The role you want to use.', true);
    this.addStringOption('emoji', 'The emoji you want to use.', true);
  }

  execute = async (interaction: CommandInteraction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;

    LogService.setPrefix('ReactionRoleCreate');

    const { guild } = interaction;
    if (!guild) return;

    const role = interaction.options.get('role')?.role;
    const emoji = interaction.options.get('emoji')?.value;

    if (!role || !emoji || typeof emoji !== 'string') {
      return interaction.reply({
        ephemeral: true,
        content:
          'I had some issues finding that role or emoji. Please try again.',
      });
    }

    const isValidPosition = isValidRolePosition(interaction, role);

    if (!isValidPosition) {
      const embed = new MessageEmbed()
        .setTitle('Reaction Roles Setup')
        .setDescription(
          `The role <@&${role.id}> is above me in the role list so I can't hand it out.{
          }\nPlease make sure I have a role that is above it.`
        );

      const button = new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel('Discord Roles')
          .setURL(
            'https://support.discord.com/hc/en-us/articles/214836687-Role-Management-101'
          )
          .setStyle('LINK')
      );

      return interaction.reply({
        ephemeral: true,
        embeds: [embed],
        components: [button],
      });
    }

    const emojiRegex = /\d+/g.exec(emoji);
    let emojiId = emoji;

    if (emojiRegex) {
      const [, id] = emojiRegex;

      emojiId = id;
    }

    /**
     * For now RoleBot doesn't allow two roles to share the same emoji.
     */
    const reactRole = await GET_REACT_ROLE_BY_EMOJI(emojiId, guild.id);

    if (reactRole) {
      return interaction.reply({
        ephemeral: true,
        content: `The role \`${reactRole.roleName}\` already has this emoji assigned to them.`,
      });
    }

    CREATE_REACT_ROLE(role.name, role.id, emojiId, interaction.guildId)
      .then(() => {
        interaction.reply({
          ephemeral: true,
          content: ':tada: Successfully created the reaction role. :tada:',
        });
      })
      .catch(() => {
        LogService.error(
          `Failed to create reaction role[${role.id}] | guild[${interaction.guildId}] | emoji[${emojiId}]`
        );
        interaction.reply({
          ephemeral: true,
          content: 'Reaction role failed to create. Please try again.',
        });
      });
  };
}

/**
 * Check that RoleBot has a role above the one the user wants to hand out.
 * @returns true if the bot has a role above the users role.
 */
function isValidRolePosition(interaction: Interaction, role: Role | APIRole) {
  const clientUser = interaction.guild?.members.cache.get(CLIENT_ID);
  if (!clientUser) return false;

  return clientUser.roles.cache.some((r) => r.position > role.position);
}
