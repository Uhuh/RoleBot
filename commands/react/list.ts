import { CommandInteraction, Permissions } from 'discord.js';
import RoleBot from '../../src/bot';
import { GET_REACT_ROLES_BY_GUILD } from '../../src/database/database';
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
      [Permissions.FLAGS.MANAGE_ROLES]
    );
  }

  execute = async (interaction: CommandInteraction) => {
    const reactRoles = await GET_REACT_ROLES_BY_GUILD(interaction.guildId);

    if (!reactRoles.length) {
      return interaction
        .reply({
          ephemeral: true,
          content: `Hey! Turns out this server doesn't have any react roles setup. How about you get to creating some?`,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    /**
     * @TODO - This is NOT a good solution because I want to also display what category each role belongs too.
     * Also also???? Something something one big embed character limit (4k chars?)
     */
    const embed = EmbedService.reactRoleListEmbed(reactRoles, this.client);

    interaction
      .reply({
        content: `Hey! Here's your react roles.`,
        embeds: [embed],
      })
      .catch((e) => {
        this.log.error(`Interaction failed.`);
        this.log.error(`${e}`);
      });
  };
}
