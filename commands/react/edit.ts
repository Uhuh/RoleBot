import {
  ChatInputCommandInteraction,
  parseEmoji,
  PermissionsBitField,
} from 'discord.js';
import {
  GET_REACT_ROLE_BY_EMOJI,
  GET_REACT_ROLE_BY_ROLE_ID,
  UPDATE_REACT_ROLE_EMOJI_ID,
  UPDATE_REACT_ROLE_EMOJI_TAG,
} from '../../src/database/queries/reactRole.query';
import { Category } from '../../utilities/types/commands';
import { RolePing } from '../../utilities/utilPings';
import { SlashCommand } from '../slashCommand';
import * as i18n from 'i18n';

export class ReactEditCommand extends SlashCommand {
  constructor() {
    super(
      'react-edit',
      'Edit any existing react roles emoji!',
      Category.react,
      [PermissionsBitField.Flags.ManageRoles]
    );

    this.addRoleOption(
      'role',
      'The role that belongs to the react role.',
      true
    );
    this.addStringOption(
      'new-emoji',
      'The new emoji for the react role.',
      true
    );
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return interaction.reply({
        ephemeral: true,
        content: `Hey! I don't see the guild ID anywhere... that's weird.`,
      });
    }

    const role = this.expect(interaction.options.getRole('role'), {
      message: i18n.__('REACT.EDIT.MISSING', {
        prop: 'role',
      }),
      prop: 'role',
    });
    const emoji = this.expect(interaction.options.getString('new-emoji'), {
      message: i18n.__('REACT.EDIT.MISSING', {
        prop: 'emoji',
      }),
      prop: 'emoji',
    });

    const doesReactRoleExist = await GET_REACT_ROLE_BY_ROLE_ID(role.id);
    if (!doesReactRoleExist) {
      return interaction.reply({
        ephemeral: true,
        content: i18n.__('REACT.EDIT.INVALID.ROLE'),
      });
    }

    const parsedEmoji = parseEmoji(emoji);

    if (!parsedEmoji?.id && !parsedEmoji?.name) {
      return interaction.reply({
        ephemeral: true,
        content: i18n.__('REACT.EDIT.INVALID.EMOJI'),
      });
    }

    const emojiContent = parsedEmoji.id ?? parsedEmoji.name;

    const emojiReactRole = await GET_REACT_ROLE_BY_EMOJI(
      emojiContent,
      interaction.guildId
    );

    if (emojiReactRole) {
      return interaction.reply({
        ephemeral: true,
        content: i18n.__('REACT.EDIT.EMOJI_USED', {
          role: RolePing(emojiReactRole.roleId),
        }),
      });
    }

    const emojiTag = parsedEmoji?.id
      ? `<${parsedEmoji.animated ? 'a' : ''}:nn:${parsedEmoji.id}>`
      : null;

    await UPDATE_REACT_ROLE_EMOJI_ID(role.id, emojiContent);
    await UPDATE_REACT_ROLE_EMOJI_TAG(role.id, emojiTag);

    this.log.debug(
      `Updated role[${role.id}] to use emoji[${JSON.stringify(parsedEmoji)} - ${
        emojiTag ?? parsedEmoji.name
      }]`,
      interaction.guildId
    );

    return interaction.reply({
      ephemeral: true,
      content: i18n.__('REACT.EDIT.SUCCESS', {
        emoji: emojiTag ?? parsedEmoji.name,
        role: RolePing(role.id),
      }),
    });
  };
}
