import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
} from 'discord.js';
import { DELETE_REACT_MESSAGES_BY_GUILD_ID } from '../../src/database/queries/reactMessage.query';
import { DELETE_ALL_REACT_ROLES_BY_GUILD_ID } from '../../src/database/queries/reactRole.query';
import { SlashSubCommand } from '../command';

export class NukeSubCommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(
      baseCommand,
      'nuke',
      'This will remove ALL react roles for this server.'
    );
  }

  handleButton = async (interaction: ButtonInteraction) => {
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

        return interaction.reply({
          ephemeral: true,
          content: `Hey! I deleted all your react roles. Any categories that had react roles are now empty.`,
        });
      })
      .catch((e) => {
        this.log.error(
          `Failed to delete reactroles\n${e}`,
          interaction.guildId
        );

        return interaction.reply({
          ephemeral: true,
          content: `Hey! I had an issue deleting all the react roles.`,
        });
      });
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${this.baseName}_${this.name}_confirm`)
        .setLabel('Confirm Nuke')
        .setStyle(ButtonStyle.Danger)
    );

    return interaction.reply({
      ephemeral: true,
      components: [buttons],
      content: `This action is irreversible. By confirming you are deleting all react roles currently setup for this server.`,
    });
  };
}
