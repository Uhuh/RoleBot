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
      return this.log.error(`Interaction missing guild ID`);
    }

    await interaction.deferReply({
      ephemeral: true,
    });

    const role = this.expect(interaction.options.getRole('role'), {
      message: `Somehow the role is missing! Please try again.`,
      prop: 'role',
    });
    const emoji = this.expect(interaction.options.getString('new-emoji'), {
      message: 'Somehow the emoji is missing! Please try again.',
      prop: 'emoji',
    });

    const doesReactRoleExist = await GET_REACT_ROLE_BY_ROLE_ID(role.id);
    if (!doesReactRoleExist) {
      return interaction.editReply(
        `Hey! That role doesn't belong to an existing react role.`
      );
    }

    const parsedEmoji = parseEmoji(emoji);

    if (!parsedEmoji?.id && !parsedEmoji?.name) {
      return interaction.editReply(
        `Hey! I had an issue parsing whatever emoji you passed in. Please wait and try again.`
      );
    }

    const emojiContent = parsedEmoji.id ?? parsedEmoji.name;

    const doesEmojiBelongToReactRole = await GET_REACT_ROLE_BY_EMOJI(
      emojiContent,
      interaction.guildId
    );

    if (doesEmojiBelongToReactRole) {
      return interaction.editReply(
        `Hey! That emoji belongs to a react role (${RolePing(
          doesEmojiBelongToReactRole.roleId
        )})`
      );
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

    return interaction.editReply(
      `:tada: Successfully updated the react role (${
        emojiTag ?? parsedEmoji.name
      } - ${RolePing(role.id)}) :tada:`
    );
  };
}
