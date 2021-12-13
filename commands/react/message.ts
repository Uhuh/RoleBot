import {
  CommandInteraction,
  MessageActionRow,
  MessageSelectMenu,
  Permissions,
  SelectMenuInteraction,
} from 'discord.js';
import { GET_GUILD_CATEGORIES } from '../../src/database/database';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class ReactMessageCommand extends SlashCommand {
  constructor() {
    super(
      'reaction-message',
      'Use this command to react with a specific category of roles to a message.',
      Category.react,
      [Permissions.FLAGS.MANAGE_ROLES]
    );

    this.addStringOption(
      'message-link',
      'Copy a message link and place it here for the message you want me to react to.',
      true
    );
  }

  execute = async (interaction: CommandInteraction) => {
    if (!interaction.isCommand()) return;

    const messageLink = interaction.options.get('message-link')?.value;

    if (!messageLink || typeof messageLink !== 'string') {
      return await interaction.reply({
        content: `Hmm, I'm not what happened but I can't see the message link. Please try again.`,
      });
    }

    const [_, channelId, messageId] = messageLink.match(/\d+/g) ?? [];

    const channel = await interaction.guild?.channels.fetch(channelId);

    if (!channel || channel.type !== 'GUILD_TEXT') {
      return await interaction.reply({
        content: `Hey! I couldn't find that channel, make sure you're copying the message link right.`,
      });
    }

    const message = await channel.messages.fetch(messageId);

    if (!message) {
      return await interaction.reply({
        content: `Hey! I couldn't find that message, make sure you're copying the message link right.`,
      });
    }

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
            description: c.description ?? '',
            value: `message-${c.guildId}-${channelId}-${messageId}-${c._id}`,
          }))
        )
    );

    await interaction.reply({
      content: `Let's make this easier for you. Select a category and I will use the reaction roles in that category to react to the message.`,
      components: [selectMenu],
    });
  };
}

export const handleMessageChoice = (interaction: SelectMenuInteraction) => {
  const [_, guildId, channelId, messageId, categoryId] =
    interaction.values[0].split('-');
};
