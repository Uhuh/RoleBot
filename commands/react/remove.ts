import {
  CommandInteraction,
  MessageActionRow,
  MessageSelectMenu,
  Permissions,
} from 'discord.js';
import { GET_REACT_ROLES_BY_GUILD } from '../../src/database/database';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class ReactDeleteCommand extends SlashCommand {
  constructor() {
    super(
      'reaction-delete',
      'Delete an existing reaction role from a drop down menu.',
      Category.react,
      [Permissions.FLAGS.MANAGE_ROLES]
    );
  }

  execute = async (interaction: CommandInteraction) => {
    const reactionRoles = await GET_REACT_ROLES_BY_GUILD(interaction.guildId);

    const selectMenu = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId('select-reactiondelete')
        .setPlaceholder('Select a reaction role to delete')
        .addOptions(
          reactionRoles.map((rr) => ({
            label: rr.roleName,
            description: `${rr.roleName} one of the reaction roles to delete.`,
            value: `rrdelete-${rr.roleId}`,
          }))
        )
    );

    interaction.reply({
      ephemeral: true,
      content: 'Reaction role created.',
      components: [selectMenu],
    });
  };
}
