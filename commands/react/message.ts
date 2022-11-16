import {
  AutocompleteInteraction,
  Channel,
  ChannelType,
  ChatInputCommandInteraction,
  NonThreadGuildBasedChannel,
  PermissionsBitField,
  TextChannel,
} from 'discord.js';

import { reactToMessage } from '../../utilities/utils';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';
import { GET_CATEGORY_BY_ID } from '../../src/database/queries/category.query';
import { GET_REACT_ROLES_BY_CATEGORY_ID } from '../../src/database/queries/reactRole.query';
import { handleAutocompleteCategory } from '../../utilities/utilAutocomplete';
import { GET_GUILD_CONFIG } from '../../src/database/queries/guild.query';
import { GuildReactType } from '../../src/database/entities/guild.entity';

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

    const { guildId } = interaction;

    const config = await GET_GUILD_CONFIG(guildId);

    if (config?.reactType !== GuildReactType.reaction) {
      return interaction.reply({
        ephemeral: true,
        content: `Hey! You can use the message command only if the config react-type is reaction.`,
      });
    }

    const messageLink = this.expect(
      interaction.options.getString('message-link'),
      {
        message:
          'Make sure to pass the message link by right click copying it on desktop!',
        prop: 'message-link',
      }
    );

    const [_, channelId, messageId] = messageLink.match(/\d+/g) ?? [];

    if (!channelId || !messageId) {
      return interaction.reply({
        ephemeral: true,
        content: `Hey! That doesn't look like a valid message link. Make sure to right click and copy \`Copy Message Link \``,
      });
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

    const channel = await interaction.guild?.channels
      .fetch(channelId)
      .catch((e) => this.log.debug(`Failed to find channel.\n${e}`, guildId));

    if (!channel || !isTextChannel(channel)) {
      return interaction.reply({
        ephemeral: true,
        content: `Hey! I couldn't find that channel, make sure you're copying the message link right and that it's from _this_ server.`,
      });
    }

    const message = await channel.messages
      .fetch(messageId)
      .catch((e) => this.log.debug(`Failed to find message.\n${e}`, guildId));

    if (!message) {
      return interaction.reply({
        ephemeral: true,
        content: `Hey! I couldn't find that message, make sure you're copying the message link right.`,
      });
    }

    await interaction.reply({
      ephemeral: true,
      content: `I'm reacting to the message with all react roles associated with ${category.name}.`,
    });

    return reactToMessage(
      message,
      guildId,
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
