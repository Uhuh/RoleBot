import { SlashCommandBuilder } from '@discordjs/builders';
import { ChannelType } from 'discord-api-types';
import {
  Interaction,
  MessageActionRow,
  MessageSelectMenu,
  SelectMenuInteraction,
} from 'discord.js';
import { GET_GUILD_CATEGORIES } from '../../src/database/database';
import { Category, DataCommand } from '../../utilities/types/commands';

export const reactMessage: DataCommand = {
  name: '/reaction-message',
  desc: 'Send reaction roles to a specific channel. Have RoleBot react to a custom message instead of using the defaults.',
  type: Category.react,
  data: new SlashCommandBuilder()
    .setName('reaction-message')
    .setDescription('Set a custom message for your reaction roles.')
    .addChannelOption((option) =>
      option
        .addChannelType(ChannelType.GuildText)
        .setName('channel')
        .setDescription('RoleBot will send its default messages')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('message-id')
        .setDescription(
          'Want rolebot to react to your message instead? Pass the message ID.'
        )
    ),
  execute: async (interaction: Interaction) => {
    if (!interaction.isCommand()) return;

    const channel = interaction.options.get('channel')?.channel;
    // Optional message ID.
    const messageId = interaction.options.get('message-id')?.value;

    // Let's make sure we can do anything related to the channel.
    if (!channel) {
      return await interaction.reply({
        ephemeral: true,
        content: `Hold on partner, it appears I couldn't find that channel. Try again with a channel I have access to.`,
      });
    } else if (channel.type !== 'GUILD_TEXT') {
      return await interaction.reply({
        ephemeral: true,
        content: `Hey! I can only be utilized in **TEXT** channels! I'm no good in anything else.`,
      });
    }

    if (messageId) {
      /**
       * @TODO - Verify the message ID before doing anything.
       */

      const categories = await GET_GUILD_CATEGORIES(interaction.guildId);

      if (!categories.length) {
        return await interaction.reply({
          content: `It appears there are no categories! Try out \`/category create\` to create a category reaction pack to store and manage your roles much easier.`,
        });
      }

      const selectMenu = new MessageActionRow().addComponents(
        new MessageSelectMenu()
          .setCustomId(`select-message`)
          .setPlaceholder(`Pick a category to react with.`)
          .addOptions(
            categories.map((c, idx) => ({
              label: c.name ?? `Category-${idx}`,
              description: c.description ?? ``,
              value: `message-${c.guildId}-${channel.id}-${messageId}-${c.categoryId}`,
            }))
          )
      );

      await interaction.reply({
        content: `Let's make this easier for you. Select a category and I will use the reaction roles in that category to react to the message.`,
        components: [selectMenu],
      });
    }
  },
};

export const handleMessageChoice = (
  interaction: SelectMenuInteraction,
  channelId: string,
  messageId: string
) => {};
