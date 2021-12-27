import { CommandInteraction, Permissions } from 'discord.js';
import RoleBot from '../../src/bot';
import { LogService } from '../../src/services/logService';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class ReactChannelCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'react-channel',
      'Send all categories with react roles to the selected channel.',
      Category.react,
      [Permissions.FLAGS.MANAGE_ROLES]
    );

    this.addChannelOption(
      'channel',
      'The channel that will receive reaction roles.',
      true
    );
  }

  public execute = (interaction: CommandInteraction) => {
    LogService.setPrefix('ReactionChannel');

    interaction.reply({
      ephemeral: true,
      content: 'Reaction role created.',
    });
  };
}
