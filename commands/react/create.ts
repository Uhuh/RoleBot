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
import RoleBot from '../../src/bot';
import {
  CREATE_REACT_ROLE,
  GET_REACT_ROLE_BY_EMOJI,
  GET_REACT_ROLE_BY_ROLE_ID,
} from '../../src/database/database';
import { ReactRoleType } from '../../src/database/entities/reactRole.entity';
import { CLIENT_ID } from '../../src/vars';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class ReactRoleCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'react-role',
      'Create a new react role. Give the command a role and an emoji. It really is that simple.',
      Category.react,
      [Permissions.FLAGS.MANAGE_ROLES]
    );

    this.addRoleOption('role', 'The role you want to use.', true);
    this.addStringOption('emoji', 'The emoji you want to use.', true);
  }

  execute = async (interaction: CommandInteraction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;

    const { guild } = interaction;
    if (!guild) return;

    const role = interaction.options.get('role')?.role;
    const [emoji] = this.extractStringVariables(interaction, 'emoji');

    if (!role || !emoji) {
      return interaction
        .reply({
          ephemeral: true,
          content:
            'I had some issues finding that role or emoji. Please try again.',
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    const isValidPosition = isValidRolePosition(interaction, role);

    if (!isValidPosition) {
      const embed = new MessageEmbed()
        .setTitle('Reaction Roles Setup')
        .setDescription(
          `The role <@&${role.id}> is above me in the role list so I can't hand it out.\nPlease make sure I have a role that is above it.`
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
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    // Custom emojis Look like this: <:name:id>
    const emojiRegex = /[0-9]{10,}/g.exec(emoji);

    // Default set the "emojiId" as the input. It's most likely just unicode.
    let emojiId = emoji;

    // This is only matched if a custom discord emoji was used.
    if (emojiRegex) {
      const id = emojiRegex[0];

      emojiId = id;
    }

    if (!emojiId || emojiId === '') {
      this.log.error(
        `Failed to extract emoji[${emoji}] with regex from string.`
      );

      return interaction
        .reply({
          ephemeral: true,
          content: `Hey! I had an issue trying to use that emoji. Please wait a moment and try again.`,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    /**
     * For now RoleBot doesn't allow two roles to share the same emoji.
     */
    let reactRole = await GET_REACT_ROLE_BY_EMOJI(emojiId, guild.id);

    if (reactRole) {
      const emojiMention =
        reactRole?.emojiId.length > 3
          ? `<:n:${reactRole?.emojiId}>`
          : reactRole?.emojiId;

      return interaction
        .reply({
          ephemeral: true,
          content: `The react role (${emojiMention} - <@&${reactRole.roleId}>) already has this emoji assigned to it.`,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    reactRole = await GET_REACT_ROLE_BY_ROLE_ID(role.id);

    if (reactRole) {
      const emojiMention =
        reactRole?.emojiId.length > 3
          ? `<:n:${reactRole?.emojiId}>`
          : reactRole?.emojiId;

      return interaction
        .reply({
          ephemeral: true,
          content: `There's a react role already using the role \`${reactRole.name}\` (${emojiMention} - <@&${reactRole.roleId}>).`,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    CREATE_REACT_ROLE(
      role.name,
      role.id,
      emojiId,
      interaction.guildId,
      ReactRoleType.normal
    )
      .then(() => {
        this.log.debug(
          `Successfully created the react role[${role.id}] with emoji[${emojiId}]`
        );

        const emojiMention = emojiId.length > 3 ? `<:n:${emojiId}>` : emojiId;

        interaction
          .reply({
            ephemeral: true,
            content: `:tada: Successfully created the react role (${emojiMention} - <@&${role.id}>) :tada:`,
          })
          .catch((e) => {
            this.log.error(`Interaction failed.`);
            this.log.error(`${e}`);
          });
      })
      .catch((e) => {
        this.log.error(
          `Failed to create react role[${role.id}] | guild[${interaction.guildId}] | emoji[id: ${emojiId} : string: ${emoji}]`
        );
        this.log.error(e);

        interaction
          .reply({
            ephemeral: true,
            content: 'React role failed to create. Please try again.',
          })
          .catch((e) => {
            this.log.error(`Interaction failed.`);
            this.log.error(`${e}`);
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
