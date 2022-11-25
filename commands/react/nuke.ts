import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from 'discord.js';
import { DELETE_REACT_MESSAGES_BY_GUILD_ID } from '../../src/database/queries/reactMessage.query';
import { DELETE_ALL_REACT_ROLES_BY_GUILD_ID } from '../../src/database/queries/reactRole.query';

import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class ReactNukeCommand extends SlashCommand {
  constructor() {
    super(
      'react-nuke',
      'This will remove ALL react roles for this server.',
      Category.react,
      [PermissionsBitField.Flags.ManageRoles]
    );
  }

  handleButton = (interaction: ButtonInteraction) => {
    if (!interaction.guildId) {
      return interaction.reply(
        `Hey! For some reason Discord didn't send me your guild info. No longer nuking.`
      );
    }

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

        return interaction.reply(
          `Hey! I deleted all your react roles. Any categories that had react roles are now empty.`
        );
      })
      .catch((e) => {
        this.log.error(
          `Failed to delete reactroles\n${e}`,
          interaction.guildId
        );

        return interaction.reply(
          `Hey! I had an issue deleting all the react roles.`
        );
      });
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply({
      ephemeral: true,
    });

    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${this.name}_confirm`)
        .setLabel('Confirm Nuke')
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.editReply({
      components: [buttons],
      content: `This action is irreversible. By confirming you are deleting all react roles currently setup for this server.`,
    });
  };
}
