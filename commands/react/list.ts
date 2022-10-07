import { ChatInputCommandInteraction, PermissionsBitField } from 'discord.js';
import RoleBot from '../../src/bot';
import { GET_REACT_ROLES_BY_GUILD } from '../../src/database/queries/reactRole.query';
import { EmbedService } from '../../src/services/embedService';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class ReactListCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'react-list',
      'List all reaction roles that are currently active.',
      Category.react,
      [PermissionsBitField.Flags.ManageRoles]
    );
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;

    try {
      // Defer because of Discord rate limits.
      await interaction
        .deferReply({
          ephemeral: true,
        })
        .catch((e) =>
          this.log.error(
            `Failed to defer interaction and the try/catch didn't catch it.\n${e}`,
            interaction.guildId
          )
        );
    } catch (e) {
      this.log.error(`Failed to defer interaction.\n${e}`, interaction.guildId);
      return;
    }

    const reactRoles = await GET_REACT_ROLES_BY_GUILD(
      interaction.guildId
    ).catch((e) =>
      this.log.critical(
        `Failed to fetch react roles\n${e}`,
        interaction.guildId
      )
    );

    if (!reactRoles || !reactRoles.length) {
      return interaction
        .editReply({
          content: `Hey! Turns out this server doesn't have any react roles setup. Start creating some with \`/react-role\`!`,
        })
        .catch((e) =>
          this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
        );
    }

    const embed = EmbedService.reactRoleListEmbed(reactRoles);

    interaction
      .editReply({
        content: `Hey! Here's your react roles.`,
        embeds: [embed],
      })
      .catch((e) =>
        this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
      );
  };
}
