import { SlashCommandBuilder } from '@discordjs/builders';
import { APIRole } from 'discord-api-types';
import {
  Interaction,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  Role,
} from 'discord.js';
import { GET_REACT_ROLE_BY_EMOJI } from '../../src/database/database';
import { CLIENT_ID } from '../../src/vars';

export const command = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Create a new reaction roles.')
    .addRoleOption((option) =>
      option
        .setName('role')
        .setDescription('The role you want to use.')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('emoji')
        .setDescription('The emoji you want to use.')
        .setRequired(true)
    ),
  execute: (interaction: Interaction) => {
    if (!interaction.isCommand()) return;
    /**
     * When user calls this command.
     * Prompt them if they want to add the role to an existing category.
     */

    const { guild } = interaction;
    if (!guild) return;

    const role = interaction.options.get('role')?.role;
    const emoji = interaction.options.get('emoji')?.value;

    if (!role || !emoji || typeof emoji !== 'string') {
      return interaction.reply({
        ephemeral: true,
        content:
          'I had some issues finding that role or emoji. Please try again.',
      });
    }

    const isValidPosition = isValidRolePosition(interaction, role);

    if (!isValidPosition) {
      const embed = new MessageEmbed()
        .setTitle('Reaction Roles Setup')
        .setDescription(
          `The role <@&${role.id}> is above me in the role list so I can't hand it out.{
          }\nPlease make sure I have a role that is above it.`
        );

      const button = new MessageActionRow().addComponents(
        new MessageButton()
          .setLabel('Discord Roles')
          .setURL(
            'https://support.discord.com/hc/en-us/articles/214836687-Role-Management-101'
          )
          .setStyle('LINK')
      );

      return interaction.reply({
        ephemeral: true,
        embeds: [embed],
        components: [button],
      });
    }

    const emojiRegex = /\d+/g.exec(emoji);
    let emojiId = emoji;

    if (emojiRegex) {
      const [, id] = emojiRegex;

      emojiId = id;
    }

    const reactRole = GET_REACT_ROLE_BY_EMOJI(emojiId, guild.id);

    interaction.reply({
      ephemeral: true,
      content: 'Reaction role created.',
    });
  },
};

/**
 * Check that RoleBot has a role above the one the user wants to hand out.
 * @returns true if the bot has a role above the users role.
 */
function isValidRolePosition(interaction: Interaction, role: Role | APIRole) {
  const clientUser = interaction.guild?.members.cache.get(CLIENT_ID);
  if (!clientUser) return false;

  return clientUser.roles.cache.some((r) => r.position > role.position);
}
