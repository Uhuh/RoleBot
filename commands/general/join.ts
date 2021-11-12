import { SlashCommandBuilder } from '@discordjs/builders';
import { Interaction } from 'discord.js';
import { Category } from '../../utilities/types/commands';

export const command = {
  name: '/auto-join',
  desc: `Setup auto join roles for the server.`,
  type: Category.general,
  data: new SlashCommandBuilder()
    .setName('auto-join')
    .setDescription('Auto join roles for users that join your server.')
    .addSubcommandGroup((subCommandGroup) =>
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
    ),
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    const command = interaction.options.getSubcommand();
    const role = interaction.options.getRole('join-role');

    interaction.reply({
      ephemeral: true,
      content: `Join responds. What command: ${command} | Was there a role: ${role}`,
    });
  },
};
