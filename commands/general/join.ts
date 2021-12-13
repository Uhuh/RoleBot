import { CommandInteraction, Permissions } from 'discord.js';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class AutoJoinCommand extends SlashCommand {
  constructor() {
    super(
      'auto-join',
      'Setup auto join roles for the server.',
      Category.general,
      [Permissions.FLAGS.MANAGE_ROLES]
    );

    // Sigh figure out how to add all this shit.
    /**
     * .addSubcommandGroup((subCommandGroup) =>
      subCommandGroup
        .setName('role')
        .setDescription('Add, remove or list all your auto-join roles.')
        .addSubcommand((command) =>
          command
            .setName('add')
            .setDescription('Add a role to your auto-join roles.')
            .addRoleOption((option) =>
              option
                .setName('join-role')
                .setDescription(
                  'Users will get this role when they join your server.'
                )
                .setRequired(true)
            )
        )
        .addSubcommand((command) =>
          command
            .setName('remove')
            .setDescription('Remove an auto join role from your list.')
        )
        .addSubcommand((command) =>
          command
            .setName('list')
            .setDescription('See all your auto join roles.')
        )
    )
     */
  }

  execute = (interaction: CommandInteraction) => {
    interaction.reply({
      ephemeral: true,
      content: `Join responds.`,
    });
  };
}
