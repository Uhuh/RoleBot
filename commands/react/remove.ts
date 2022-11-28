import {
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
} from 'discord.js';
import {
  DELETE_REACT_ROLE_BY_ROLE_ID,
  GET_REACT_ROLE_BY_ROLE_ID,
} from '../../src/database/queries/reactRole.query';
import { RolePing } from '../../utilities/utilPings';
import { ReactMessageUpdate, updateReactMessages } from '../../utilities/utils';
import { SlashSubCommand } from '../command';

export class RemoveSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(baseCommand, 'remove', 'Remove an existing reaction role.', [
      {
        name: 'role',
        description: 'The react role to remove.',
        required: true,
        type: ApplicationCommandOptionType.Role,
      },
    ]);
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    const role = interaction.options.getRole('role');

    if (!role) {
      this.log.error(
        `Interaction was missing role property despite it being required.`,
        interaction.guildId
      );

      return interaction.editReply(
        `Hey! For some reason I was unable to get the role that you told me to delete. Is it already deleted? Please try again. :)`
      );
    }

    const reactRole = await GET_REACT_ROLE_BY_ROLE_ID(role.id);

    if (!reactRole) {
      this.log.debug(
        `User passed in role[${role.id}] that isn't in guilds reactRoles list.`,
        interaction.guildId
      );

      return interaction.editReply(
        `Hey! That role isn't in my system, perhaps you meant to pass in a different role?`
      );
    }

    try {
      await DELETE_REACT_ROLE_BY_ROLE_ID(role.id);

      this.log.info(
        `Successfully removed guilds react role[${role.id}]`,
        interaction.guildId
      );

      const emojiMention = reactRole?.emojiTag ?? reactRole?.emojiId;

      await interaction.editReply(
        `I successfully removed the react role (${emojiMention} - ${RolePing(
          role.id
        )})! You can add it back at any time if you wish.\n\nI'm gonna do some cleanup now and update any react role embed...`
      );

      // Only update react message if there's a category associated with it.
      if (reactRole.categoryId) {
        return updateReactMessages(
          interaction,
          reactRole.categoryId,
          this.log,
          ReactMessageUpdate.reactRoleRemove
        );
      }
    } catch (e) {
      this.log.error(
        `Error'd when trying to delete react role[${role.id}]\n${e}`,
        interaction.guildId
      );

      return interaction.editReply(
        `Hey! I had an issue deleting that react role. Please wait a moment and try again.`
      );
    }
  };
}
