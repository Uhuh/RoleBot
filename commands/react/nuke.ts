import {
  ButtonInteraction,
  CommandInteraction,
  MessageActionRow,
  MessageButton,
  Permissions,
} from 'discord.js-light';
import RoleBot from '../../src/bot';
import { DELETE_REACT_MESSAGES_BY_GUILD_ID } from '../../src/database/queries/reactMessage.query';
import { DELETE_ALL_REACT_ROLES_BY_GUILD_ID } from '../../src/database/queries/reactRole.query';

import { Category } from '../../utilities/types/commands';
import { handleInteractionReply } from '../../utilities/utils';
import { SlashCommand } from '../slashCommand';

export class ReactNukeCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'react-nuke',
      'This will remove ALL react roles for this server.',
      Category.react,
      [Permissions.FLAGS.MANAGE_ROLES]
    );
  }

  handleButton = (interaction: ButtonInteraction) => {
    if (!interaction.guildId) {
      return interaction.reply(
        `Hey! For some reason Discord didn't send me your guild info. No longer nuking.`
      );
    }

    handleInteractionReply(
      this.log,
      interaction,
      `User ${
        interaction.member?.user || '[REDACTED]'
      } has confirmed and deleted all react roles for the server.`
    );

    // Need to delete all react messages or users will be able to react still and get roles.
    DELETE_REACT_MESSAGES_BY_GUILD_ID(interaction.guildId)
      .then(() => {
        this.log.debug(`Cleared react messages`, interaction.guildId);
      })
      .catch((e) => {
        this.log.error(
          `Failed to clear react messages\n${e}`,
          interaction.guildId
        );
      });

    DELETE_ALL_REACT_ROLES_BY_GUILD_ID(interaction.guildId)
      .then(() => {
        this.log.debug(
          `User[${interaction.user.id}] removed ALL reactroles`,
          interaction.guildId
        );

        handleInteractionReply(
          this.log,
          interaction,
          `Hey! I deleted all your react roles. Any categories that had react roles are now empty.`
        );
      })
      .catch((e) => {
        this.log.error(
          `Failed to delete reactroles\n${e}`,
          interaction.guildId
        );

        handleInteractionReply(
          this.log,
          interaction,
          `Hey! I had an issue deleting all the react roles.`
        );
      });
  };

  execute = (interaction: CommandInteraction) => {
    const buttons = new MessageActionRow().addComponents(
      new MessageButton()
        .setCustomId(`${this.name}_confirm`)
        .setLabel('Confirm Nuke')
        .setStyle('PRIMARY')
    );

    interaction.reply({
      ephemeral: true,
      components: [buttons],
      content: `This action is irreversable. By confirming you are deleting all react roles currently setup for this server.`,
    });
  };
}
