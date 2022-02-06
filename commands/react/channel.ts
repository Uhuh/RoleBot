import { APIInteractionDataResolvedChannel } from 'discord-api-types';
import {
  CommandInteraction,
  GuildChannel,
  Permissions,
  TextChannel,
  ThreadChannel,
} from 'discord.js';
import RoleBot from '../../src/bot';
import {
  GET_GUILD_CATEGORIES,
  GET_REACT_ROLES_BY_CATEGORY_ID,
} from '../../src/database/database';
import { EmbedService } from '../../src/services/embedService';
import { HasPerms } from '../../src/services/permissionService';
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
      interaction
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
        .reply(
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
        .reply({
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
        .reply(
          `Hey! I failed to find the channel from the command. Please wait a second and try again.`
        )
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    } else if (!isTextChannel(channel)) {
      this.log.error(
        `Passed in channel[${channel.id}] was not a text channel for guild[${interaction.guildId}]`
      );

      return interaction
        .reply(`Hey! I only support sending embeds to text channels!`)
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    // Verify that the client has the correct perms for the channel.
    const canClientSendEmbeds =
      await this.client.permissionService.canClientPrepareReactMessage(
        interaction.guildId,
        channel.id
      );

    if (canClientSendEmbeds === HasPerms.error) {
      return interaction
        .reply({
          ephemeral: true,
          content: `Hey! I ran into some issues. Could you please wait a second and try again?`,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

    if (!canClientSendEmbeds) {
      const permissions = [
        Permissions.FLAGS.ADD_REACTIONS,
        Permissions.FLAGS.SEND_MESSAGES,
        Permissions.FLAGS.MANAGE_MESSAGES,
        Permissions.FLAGS.MANAGE_ROLES,
      ]
        .map((p) => `\`${PermissionMappings.get(p)}\``)
        .join(' ');

      return interaction
        .reply({
          ephemeral: true,
          content:
            `Hey! I don't have the right permissions in <#${channel.id}> to correctly setup the react role embeds. I need ${permissions} to work as intended.` +
            `
Why do I need these permissions in this channel?
\`\`\`
- Have to be able to react, it is a react role bot.
- Have to be able to send embeds.
- To update the embeds react role list.
- To update users roles.
\`\`\``,
        })
        .catch((e) => {
          this.log.error(`Interaction failed.`);
          this.log.error(`${e}`);
        });
    }

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

      channel
        .send({
          embeds: [embed],
        })
        .then((m) => {
          reactToMessage(
            m,
            categoryRoles,
            channel.id,
            category.id,
            false,
            this.log
          );
        })
        .catch((e) => {
          this.log.error(
            `Failed to send category[${category.id}] react embed to channel[${channel.id}] for guild[${interaction.guildId}]`
          );
          this.log.error(`${e}`);
          interaction.channel
            ?.send(
              `Hey! I failed to send those embeds to <#${channel.id}>. Do I have send **embed** and message permissions for it?`
            )
            .catch(() =>
              this.log.error(`Failed to warn user aboput message perms.`)
            );
        });

      await new Promise((res) => {
        setTimeout(() => res(`Send next category message.`), 1000);
      });
    }

    interaction.editReply({
      content: 'Hey! I sent those embeds and am currently reacting to them.',
    });
  };
}

function isTextChannel(
  channel: GuildChannel | ThreadChannel | APIInteractionDataResolvedChannel
): channel is TextChannel {
  return channel instanceof GuildChannel || channel instanceof ThreadChannel;
}
