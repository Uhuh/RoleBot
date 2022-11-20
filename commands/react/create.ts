import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  parseEmoji,
  PermissionsBitField,
} from 'discord.js';
import { ReactRoleType } from '../../src/database/entities/reactRole.entity';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import { isValidRolePosition } from '../../utilities/utils';
import {
  CREATE_REACT_ROLE,
  GET_REACT_ROLES_BY_GUILD,
  GET_REACT_ROLE_BY_EMOJI,
  GET_REACT_ROLE_BY_ROLE_ID,
} from '../../src/database/queries/reactRole.query';
import { RolePing } from '../../utilities/utilPings';
import * as i18n from 'i18n';

export class ReactRoleCommand extends SlashCommand {
  constructor() {
    super(
      'react-role',
      'Create a new react role. Give the command a role and an emoji. It really is that simple.',
      Category.react,
      [PermissionsBitField.Flags.ManageRoles]
    );

    this.addRoleOption('role', 'The role you want to use.', true);
    this.addStringOption('emoji', 'The emoji you want to use.', true);
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;

    const { guild } = interaction;
    if (!guild) return;

    const role = this.expect(interaction.options.getRole('role'), {
      message: i18n.__('REACT.CREATE.MISSING.ROLE'),
      prop: 'role',
    });
    const emoji = this.expect(interaction.options.getString('emoji'), {
      message: i18n.__('REACT.CREATE.MISSING.EMOJI'),
      prop: 'emoji',
    });

    const reactRolesNotInCategory = (
      await GET_REACT_ROLES_BY_GUILD(guild.id)
    ).filter((r) => !r.categoryId).length;

    /**
     * Discord button row limitation is 5x5 so only a max of 25 buttons.
     */
    if (reactRolesNotInCategory >= 24) {
      return interaction.reply({
        ephemeral: true,
        content: i18n.__('REACT.CREATE.MAX_ALLOWED_NO_CATEGORY', {
          num: `${reactRolesNotInCategory}`,
        }),
      });
    }

    const isValidPosition = await isValidRolePosition(interaction, role);

    if (!isValidPosition) {
      const embed = new EmbedBuilder()
        .setTitle(i18n.__('GENERAL.JOIN.INVALID_TITLE'))
        .setDescription(
          i18n.__('GENERAL.JOIN.INVALID_DESCRIPTION', {
            role: RolePing(role.id),
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

    const parsedEmoji = parseEmoji(emoji);

    if (!parsedEmoji?.id && !parsedEmoji?.name) {
      return interaction.reply({
        ephemeral: true,
        content: i18n.__('REACT.CREATE.INVALID.EMOJI'),
      });
    }

    /**
     * For now RoleBot doesn't allow two roles to share the same emoji.
     */
    let reactRole = await GET_REACT_ROLE_BY_EMOJI(
      parsedEmoji?.id ?? emoji,
      guild.id
    );

    if (reactRole) {
      const emojiMention = reactRole?.emojiTag ?? reactRole?.emojiId;

      return interaction.reply({
        ephemeral: true,
        content: i18n.__('REACT.CREATE.EMOJI_USED', {
          emoji: emojiMention,
          role: RolePing(reactRole.roleId),
        }),
      });
    }

    /**
     * Also check that the role isn't used already.
     */
    reactRole = await GET_REACT_ROLE_BY_ROLE_ID(role.id);

    if (reactRole) {
      const emojiMention = reactRole?.emojiTag ?? reactRole?.emojiId;

      return interaction.reply({
        ephemeral: true,
        content: i18n.__('REACT.CREATE.ROLE_USED', {
          role: RolePing(reactRole.roleId),
          emoji: emojiMention,
          name: reactRole.name,
        }),
      });
    }

    /* This is used when mentioning a custom emoji, otherwise it's unicode and doesn't have a custom ID. */
    const emojiTag = parsedEmoji?.id
      ? `<${parsedEmoji.animated ? 'a' : ''}:nn:${parsedEmoji.id}>`
      : null;

    CREATE_REACT_ROLE(
      role.name,
      role.id,
      parsedEmoji?.id ?? parsedEmoji?.name ?? emoji,
      emojiTag,
      interaction.guildId,
      ReactRoleType.normal
    )
      .then((reactRole) => {
        this.log.debug(
          `Successfully created the react role[${role.id}] with emoji[${
            parsedEmoji?.id ?? parsedEmoji.name
          }]`,
          interaction.guildId
        );

        const emojiMention = reactRole?.emojiTag ?? reactRole?.emojiId;

        return interaction.reply({
          ephemeral: true,
          content: i18n.__('REACT.CREATE.SUCCESS', {
            emoji: emojiMention,
            role: RolePing(role.id),
          }),
        });
      })
      .catch((e) => {
        this.log.error(
          `Failed to create react role[${role.id}] | emoji[id: ${parsedEmoji?.id} : string: ${emoji}]\n${e}`,
          interaction.guildId
        );

        return interaction.reply({
          ephemeral: true,
          content: i18n.__('REACT.CREATE.FAILED'),
        });
      });
  };
}
