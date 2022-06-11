import { CommandInteraction, Permissions } from 'discord.js-light';
import RoleBot from '../../src/bot';
import { GET_REACT_ROLES_BY_GUILD } from '../../src/database/database';
import { EmbedService } from '../../src/services/embedService';
import { Category } from '../../utilities/types/commands';
import { handleInteractionReply } from '../../utilities/utils';
import { SlashCommand } from '../slashCommand';

export class ReactListCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'react-list',
      'List all reaction roles that are currently active.',
      Category.react,
      [Permissions.FLAGS.MANAGE_ROLES]
    );
  }

  execute = async (interaction: CommandInteraction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;

    const reactRoles = await GET_REACT_ROLES_BY_GUILD(
      interaction.guildId
    ).catch((e) =>
      this.log.critical(
        `Failed to fetch react roles for guild[${interaction.guildId}]\n${e}`
      )
    );

    if (!reactRoles || !reactRoles.length) {
      return handleInteractionReply(this.log, interaction, `Hey! Turns out this server doesn't have any react roles setup. Start creating some with \`/react-role\`!`);
    }

    const embed = EmbedService.reactRoleListEmbed(reactRoles);

    interaction
      .reply({
        content: `Hey! Here's your react roles.`,
        embeds: [embed],
      })
      .catch((e) => this.log.error(`Interaction failed.\n${e}`));
  };
}
