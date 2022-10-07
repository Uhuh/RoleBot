import { codeBlock } from '@discordjs/builders';
import {
  ChannelType,
  ChatInputCommandInteraction,
  PermissionsBitField,
} from 'discord.js';
import RoleBot from '../../src/bot';

import { EmbedService } from '../../src/services/embedService';
import { reactToMessage } from '../../utilities/utils';
import { Category } from '../../utilities/types/commands';
import { PermissionMappings, SlashCommand } from '../slashCommand';
import { GET_GUILD_CATEGORIES } from '../../src/database/queries/category.query';
import { GET_REACT_ROLES_BY_CATEGORY_ID } from '../../src/database/queries/reactRole.query';
import { ChannelPing } from '../../utilities/utilPings';

export class ReactChannelCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(
      client,
      'react-channel',
      'Send all categories with react roles to the selected channel.',
      Category.react,
      [PermissionsBitField.Flags.ManageRoles]
    );

    this.addChannelOption(
      'channel',
      'The channel that will receive reaction roles.',
      true
    );
  }

  public execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    try {
      // Defer because of Discord rate limits.
      await interaction
        .deferReply({
          ephemeral: true,
        })
        .catch((e) =>
          this.log.error(
            `Failed to defer interaction and the try/catch didn't catch it.\n${e}`,
            interaction.guildId
          )
        );
    } catch (e) {
      this.log.error(`Failed to defer interaction.\n${e}`, interaction.guildId);
      return;
    }

    const categories = await GET_GUILD_CATEGORIES(interaction.guildId).catch(
      (e) =>
        this.log.error(`Failed to get categories\n${e}`, interaction.guildId)
    );

    if (!categories) {
      this.log.debug(`Guild has no categories.`, interaction.guildId);

      return interaction
        .editReply(
          `Hey! You need to make some categories and fill them with react roles before running this command. Check out \`/category-add\`.`
        )
        .catch((e) =>
          this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
        );
    }

    // Stolen from @react/message execute function
    const allCategoriesAreEmpty = `Hey! It appears all your categories are empty. I can't react to the message you want if you have at least one react role in at least one category. Check out \`/category-add\` to start adding roles to a category.`;
    const categoryRoles = await Promise.all(
      categories.map((c) => GET_REACT_ROLES_BY_CATEGORY_ID(c.id))
    );

    // Presumably, if all the array of roles for each category is length 0 then this being 0 is "false"
    const allEmptyCategories = categoryRoles.filter((r) => r.length).length;

    if (!allEmptyCategories) {
      this.log.debug(
        `Guild has categories but all of them are empty.`,
        interaction.guildId
      );

      return interaction
        .editReply({
          content: allCategoriesAreEmpty,
        })
        .catch((e) =>
          this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
        );
    }

    const channel = interaction.options.getChannel('channel');

    if (!channel) {
      this.log.info(
        `Could not find channel on interaction.`,
        interaction.guildId
      );

      return interaction
        .editReply(
          `Hey! I failed to find the channel from the command. Please wait a second and try again.`
        )
        .catch((e) =>
          this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
        );
    } else if (!(channel?.type === ChannelType.GuildText)) {
      this.log.error(
        `Passed in channel[${channel.id}] was not a text channel`,
        interaction.guildId
      );

      return interaction
        .editReply(`Hey! I only support sending embeds to text channels!`)
        .catch((e) =>
          this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
        );
    }

    const permissions = [
      PermissionsBitField.Flags.ReadMessageHistory,
      PermissionsBitField.Flags.AddReactions,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.ManageRoles,
    ]
      .map((p) => `\`${PermissionMappings.get(p)}\``)
      .join(' ');

    const permissionError =
      `Hey! I don't have the right permissions in ${ChannelPing(
        channel.id
      )} to correctly setup the react role embeds. I need ${permissions} to work as intended.` +
      'Why do I need these permissions in this channel?\n' +
      codeBlock(`
      - To be able to react I have to be able to see the message so I need the history for the channel.
      - Have to be able to react, it is a react role bot.
      - Have to be able to send embeds.
      - To update the embeds react role list.
      - To update users roles.
      `);

    /* There might be a better solution to this. Potentially reply first, then update the interaction later. Discord interactions feel so incredibly inconsistent though. So for now force users to WAIT the whole 3 seconds so that Discord doesn't cry. */
    await new Promise((res) => {
      setTimeout(
        () =>
          res(`I have to wait at least 3 seconds before Discord goes crazy.`),
        3000
      );
    });

    const textChannel = await interaction.guild?.channels.fetch(channel.id);
    if (textChannel?.type !== ChannelType.GuildText) return;

    for (const category of categories) {
      const categoryRoles = await GET_REACT_ROLES_BY_CATEGORY_ID(category.id);
      if (!categoryRoles.length) continue;

      const embed = EmbedService.reactRoleEmbed(categoryRoles, category);

      try {
        const reactEmbedMessage = await textChannel.send({
          embeds: [embed],
        });

        reactToMessage(
          reactEmbedMessage,
          interaction.guildId,
          categoryRoles,
          channel.id,
          category.id,
          false,
          this.log
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        this.log.error(`Failed to send embeds.\n${e}`, interaction.guildId);

        /**
         * Somehow the type DiscordAPIError DOES NOT include the httpStatus code despite the returned error here having it.
         * They also only set their "status" property as undefined. Lol?
         */
        if (e?.httpStatus === 403) {
          return interaction.editReply(permissionError);
        }

        return interaction.editReply(
          `Hey! I encounted an error. Report this to the support server. \`${e}\``
        );
      }

      await new Promise((res) => {
        setTimeout(() => res(`Send next category message.`), 1000);
      });
    }

    interaction
      .editReply({
        content: 'Hey! I sent those embeds and am currently reacting to them.',
      })
      .catch((e) =>
        this.log.error(
          `Failed to edit interaction reply.\n${e}`,
          interaction.guildId
        )
      );
  };
}
