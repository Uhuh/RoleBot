import {
  AutocompleteInteraction,
  Channel,
  ChannelType,
  ChatInputCommandInteraction,
  NonThreadGuildBasedChannel,
  PermissionsBitField,
  TextChannel,
} from 'discord.js';

import { handleInteractionReply, reactToMessage } from '../../utilities/utils';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import { GET_CATEGORY_BY_ID } from '../../src/database/queries/category.query';
import { GET_REACT_ROLES_BY_CATEGORY_ID } from '../../src/database/queries/reactRole.query';
import { handleAutocompleteCategory } from '../../utilities/utilAutocomplete';

export class ReactMessageCommand extends SlashCommand {
  constructor() {
    super(
      'react-message',
      'Use this command to react with a specific category of roles to a message.',
      Category.react,
      [PermissionsBitField.Flags.ManageRoles]
    );

    this.addStringOption(
      'message-link',
      'Copy a message link and place it here for the message you want me to react to.',
      true
    );

    this.addStringOption(
      'category',
      'The category you wish to react with!',
      true,
      [],
      true
    );
  }

  handleAutoComplete = async (interaction: AutocompleteInteraction) => {
    try {
      await handleAutocompleteCategory(interaction);
    } catch (e) {
      this.log.error(`Failed to get categories for autocomplete.\n${e}`);

      await interaction.respond([
        { name: `SHOULD NOT SEE THIS! :)`, value: 'oopsies!' },
      ]);
    }
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;

    const [messageLink] = this.extractStringVariables(
      interaction,
      'message-link'
    );

    if (!messageLink) {
      return handleInteractionReply(
        this.log,
        interaction,
        `Hmm, I'm not sure what happened but I can't see the message link. Please try again.`
      );
    }

    const [_, channelId, messageId] = messageLink.match(/\d+/g) ?? [];

    if (!channelId || !messageId) {
      return handleInteractionReply(
        this.log,
        interaction,
        `Hey! That doesn't look like a valid message link. Make sure to right click and copy \`Copy Message Link \``
      );
    }

    const categoryId = interaction.options.getString('category');

    if (isNaN(Number(categoryId))) {
      return interaction.reply({
        ephemeral: true,
        content: `Hey! Did you hit enter too fast? I can't find that category. Please wait and try again.`,
      });
    }

    const category = this.expect(await GET_CATEGORY_BY_ID(Number(categoryId)), {
      message: 'I failed to find that category! Try again.',
      prop: 'category',
    });

    const roles = await GET_REACT_ROLES_BY_CATEGORY_ID(category.id);

    if (!roles.length) {
      return interaction.reply({
        ephemeral: true,
        content: `Hey! Category \`${category.name}\` doesn't have any react roles in it. How about making some with \`/react-role\`?`,
      });
    }

    const channel = await interaction.guild?.channels.fetch(channelId);

    if (!channel || !isTextChannel(channel)) {
      return handleInteractionReply(
        this.log,
        interaction,
        `Hey! I couldn't find that channel, make sure you're copying the message link right.`
      );
    }

    const message = await channel.messages.fetch(messageId);

    if (!message) {
      return handleInteractionReply(
        this.log,
        interaction,
        `Hey! I couldn't find that message, make sure you're copying the message link right.`
      );
    }

    handleInteractionReply(this.log, interaction, {
      ephemeral: true,
      content: `I'm reacting to the message with all react roles associated with ${category.name}.`,
    });

    return reactToMessage(
      message,
      interaction.guildId,
      roles,
      channel.id,
      category.id,
      true,
      this.log
    );
  };
}

function isTextChannel(
  channel: NonThreadGuildBasedChannel | Channel
): channel is TextChannel {
  return channel.type === ChannelType.GuildText;
}
