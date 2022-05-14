import {
  CommandInteraction,
  GuildBasedChannel,
  Permissions,
  TextChannel,
} from 'discord.js-light';
import RoleBot from '../../src/bot';
import {
  GET_GUILD_CATEGORIES,
  GET_REACT_ROLES_BY_CATEGORY_ID,
} from '../../src/database/database';
import { EmbedService } from '../../src/services/embedService';
import { reactToMessage } from '../../utilities/functions/reactions';
import { Category } from '../../utilities/types/commands';
import { PermissionMappings, SlashCommand } from '../slashCommand';

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

  public execute = async (interaction: CommandInteraction) => {
    if (!interaction.guildId) {
      return this.log.error(`GuildID did not exist on interaction.`);
    }

    try {
      // Defer because of Discord rate limits.
      await interaction
        .deferReply({
          ephemeral: true,
        })
        .catch((e) => {
          this.log.error(
            `Failed to defer interaction and the try/catch didn't catch it`
          );
          this.log.critical(`${e}`);
        });
    } catch (e) {
      this.log.error(`Failed to defer interaction`);
      this.log.critical(`${e}`);
      return;
    }

    const categories = await GET_GUILD_CATEGORIES(interaction.guildId).catch(
      (e) => {
        this.log.error(
          `Failed to get categories for guild[${interaction.guildId}]`
        );
        this.log.error(e);
      }
    );

    if (!categories) {
      this.log.debug(`Guild[${interaction.guildId}] has no categories.`);

      return interaction
        .editReply(
          `Hey! You need to make some categories and fill them with react roles before running this command. Check out \`/category-add\`.`
        )
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
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
        `Guild[${interaction.guildId}] has categories but all of them are empty.`
      );

      return interaction
        .editReply({
          content: allCategoriesAreEmpty,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    const channel = interaction.options.getChannel('channel');

    if (!channel) {
      this.log.error(
        `Could not find channel on interaction for guild[${interaction.guildId}]`
      );

      return interaction
        .editReply(
          `Hey! I failed to find the channel from the command. Please wait a second and try again.`
        )
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    } else if (!(channel?.type === 'GUILD_TEXT')) {
      this.log.error(
        `Passed in channel[${channel.id}] was not a text channel for guild[${interaction.guildId}]`
      );

      return interaction
        .editReply(`Hey! I only support sending embeds to text channels!`)
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    const permissions = [
      Permissions.FLAGS.READ_MESSAGE_HISTORY,
      Permissions.FLAGS.ADD_REACTIONS,
      Permissions.FLAGS.SEND_MESSAGES,
      Permissions.FLAGS.MANAGE_MESSAGES,
      Permissions.FLAGS.MANAGE_ROLES,
    ]
      .map((p) => `\`${PermissionMappings.get(p)}\``)
      .join(' ');

    const permissionError =
      `Hey! I don't have the right permissions in <#${channel.id}> to correctly setup the react role embeds. I need ${permissions} to work as intended.` +
      `
Why do I need these permissions in this channel?
\`\`\`
- To be able to react I have to be able to see the message so I need the history for the channel.
- Have to be able to react, it is a react role bot.
- Have to be able to send embeds.
- To update the embeds react role list.
- To update users roles.
\`\`\``;

    /* There might be a better solution to this. Potentially reply first, then update the interaction later. Discord interactions feel so incredibly inconsistent though. So for now force users to WAIT the whole 3 seconds so that Discord doesn't cry. */
    await new Promise((res) => {
      setTimeout(
        () =>
          res(`I have to wait at least 3 seconds before Discord goes crazy.`),
        3000
      );
    });

    for (const category of categories) {
      const categoryRoles = await GET_REACT_ROLES_BY_CATEGORY_ID(category.id);
      if (!categoryRoles.length) continue;

      const embed = EmbedService.reactRoleEmbed(categoryRoles, category);

      try {
        const reactEmbedMessage = await channel.send({
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
      } catch (e: any) {
        this.log.error(`Failed to send embeds`);
        this.log.critical(`${e}`);

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
      .catch((e) => {
        // Defer can fail
        this.log.error(`Failed to edit interaction reply.`);
        this.log.critical(`${e}`);
      });
  };
}
