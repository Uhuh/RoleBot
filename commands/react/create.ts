import {
  ActionRowBuilder,
  APIRole,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  parseEmoji,
  Role,
} from 'discord.js';
import { ReactRoleType } from '../../src/database/entities/reactRole.entity';
import {
  CREATE_REACT_ROLE,
  GET_REACT_ROLE_BY_EMOJI,
  GET_REACT_ROLE_BY_ROLE_ID,
  GET_REACT_ROLES_NOT_IN_CATEGORIES,
} from '../../src/database/queries/reactRole.query';
import { RolePing } from '../../utilities/utilPings';
import { isValidRolePosition } from '../../utilities/utils';
import { SlashSubCommand } from '../command';

const enum CommandOptionNames {
  Role = 'role',
  Emoji = 'emoji',
  Description = 'description',
}

export class CreateSubcommand extends SlashSubCommand {
  constructor(baseCommand: string) {
    super(baseCommand, 'create', 'Create a new react role.', [
      {
        name: CommandOptionNames.Role,
        description: 'The role the user will get.',
        required: true,
        type: ApplicationCommandOptionType.Role,
      },
      {
        name: CommandOptionNames.Emoji,
        description: 'The emoji users will use',
        required: true,
        type: ApplicationCommandOptionType.String,
      },
      {
        name: CommandOptionNames.Description,
        description: 'Describe the purpose of the role for your users!',
        type: ApplicationCommandOptionType.String,
      },
    ]);
  }

  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.isCommand() || !interaction.guildId) return;

    await interaction.deferReply({
      ephemeral: true,
    });

    const { guild } = interaction;
    if (!guild) return;

    const role = this.expect(interaction.options.getRole(CommandOptionNames.Role), {
      message: `Somehow the role is missing! Please try again.`,
      prop: 'role',
    });
    const emoji = this.expect(interaction.options.getString(CommandOptionNames.Emoji), {
      message: 'Somehow the emoji is missing! Please try again.',
      prop: 'emoji',
    });
    const description = interaction.options.getString(CommandOptionNames.Description);

    const reactRolesNotInCategory = (
      await GET_REACT_ROLES_NOT_IN_CATEGORIES(guild.id)
    ).filter((r) => !r.categoryId).length;

    /**
     * Discord button row limitation is 5x5 so only a max of 25 buttons.
     */
    if (reactRolesNotInCategory >= 24) {
      return interaction.editReply({
        content: `Hey! It turns out you have ${reactRolesNotInCategory} react roles not in a category.\nPlease add some react roles to a category before creating anymore. If however \`/category add\` isn't responding please *remove* some react roles to get below 25 **not in a category**. This is due to a Discord limitation!`,
      });
    }

    const isValid = await this.isValid(interaction, role, emoji);

    // This check if the role or emoji are already in use, and does some emoji validation
    if (!isValid) {
      return;
    }

    const parsedEmoji = parseEmoji(emoji);

    /* This is used when mentioning a custom emoji, otherwise it's unicode and doesn't have a custom ID. */
    const emojiTag = parsedEmoji?.id
      ? `<${parsedEmoji.animated ? 'a' : ''}:nn:${parsedEmoji.id}>`
      : null;

    CREATE_REACT_ROLE(
      role.name,
      description,
      role.id,
      parsedEmoji?.id ?? parsedEmoji?.name ?? emoji,
      emojiTag,
      interaction.guildId,
      ReactRoleType.normal
    )
      .then((reactRole) => {
        this.log.debug(
          `Successfully created the react role[${role.id}] with emoji[${
            parsedEmoji?.id ?? parsedEmoji?.name
          }]`,
          interaction.guildId
        );

        const emojiMention = reactRole?.emojiTag ?? reactRole?.emojiId;

        return interaction.editReply(
          `:tada: Successfully created the react role (${emojiMention} - ${RolePing(
            role.id
          )}) :tada: \n**Make sure to add your newly created react role to a category with \`/category add\`!**\n\n**Note: React roles can only have one emoji related to a role, if you use multiple emojis for a role it will break!**`
        );
      })
      .catch((e) => {
        this.log.error(
          `Failed to create react role[${role.id}] | emoji[id: ${parsedEmoji?.id} : string: ${emoji}]\n${e}`,
          interaction.guildId
        );

        return interaction.editReply(
          'React role failed to create. Please try again.'
        );
      });
  };

  /**
   * Check that the given values are valid and that the react role doesn't already exist with these parameters.
   * @param interaction The interaction to respond with
   * @param role The role to check if existing
   * @param emoji Emoji to parse and validate, and to check if already in use.
   * @returns True if valid, false if any step is wrong.
   */
  private async isValid(interaction: ChatInputCommandInteraction, role: Role | APIRole, emoji: string): Promise<boolean> {
    const { guild } = interaction;
    if (!guild) return false;

    const isValidPosition = await isValidRolePosition(interaction, role);

    if (!isValidPosition) {
      const embed = new EmbedBuilder()
        .setTitle('Reaction Roles Setup')
        .setDescription(
          `The role ${RolePing(
            role.id
          )} is above me in the role list which you can find in \`Server settings > Roles\`.\nPlease make sure that my role that is listed above the roles you want to assign.`
        );

      const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Discord Roles')
          .setURL(
            'https://support.discord.com/hc/en-us/articles/214836687-Role-Management-101'
          )
          .setStyle(ButtonStyle.Link)
      );

      await interaction.editReply({
        embeds: [embed],
        components: [button],
      });

      return false;
    }

    const parsedEmoji = parseEmoji(emoji);

    if ((!parsedEmoji?.id && !parsedEmoji?.name) || !parsedEmoji) {
      await interaction.editReply(
        `Hey! I had an issue parsing whatever emoji you passed in. Please wait and try again.`
      );

      return false;
    }

    /**
     * Only custom Discord emojis have IDs
     * So check if the bot can even see the emoji.
     */
    if (parsedEmoji && parsedEmoji.id) {
      // Force the emoji cache to update encase the user just added the emoji to their server.
      const emoji = await interaction.guild?.emojis
        .fetch(parsedEmoji.id)
        .catch((e) =>
          this.log.debug(
            `Couldn't fetch emoji, most likely in different server.\n${e}`
          )
        );

      if (!emoji) {
        const doesBotHaveAccess = await this.doesBotHaveEmojiAccess(
          interaction,
          parsedEmoji
        );

        if (!doesBotHaveAccess) {
          await interaction.editReply(
            `Hey! I can't find the emoji you passed in, you most likely used an emoji that's in a server I'm not in.\nEither invite me to that server, create the emoji here or use a different emoji.`
          );

          return false;
        }
      }
    }

    /**
     * For now RoleBot doesn't allow two roles to share the same emoji.
     */
    let reactRole = await GET_REACT_ROLE_BY_EMOJI(
      parsedEmoji?.id ?? emoji,
      guild.id
    );

    if (reactRole) {
      const emojiMention = reactRole?.emojiTag ?? reactRole?.emojiId;

      await interaction.editReply(
        `The react role (${emojiMention} - ${RolePing(
          reactRole.roleId
        )}) already has this emoji assigned to it.`
      );

      return false;
    }

    /**
     * Also check that the role isn't used already.
     */
    reactRole = await GET_REACT_ROLE_BY_ROLE_ID(role.id);

    if (reactRole) {
      const emojiMention = reactRole?.emojiTag ?? reactRole?.emojiId;
      await interaction.editReply(
        `There's a react role already using the role \`${
          reactRole.name
        }\` (${emojiMention} - ${RolePing(reactRole.roleId)}).`
      );

      return false;
    }

    return true;
  }

  /**
   * Find if bot has access to an emoji on any guild on a shard.
   * @param interaction to grab client shard and get all guild emoji caches
   * @param emoji the emoji to find and see if it exist
   * @returns true if emoji exist on some guild
   */
  private async doesBotHaveEmojiAccess(
    interaction: ChatInputCommandInteraction,
    emoji: {
      animated: boolean;
      name: string;
      id: string | null;
    }
  ) {
    try {
      const emojis = (
        await interaction.client.shard?.broadcastEval((c) =>
          c.guilds.cache.map((g) => g.emojis.cache)
        )
      )?.flat(3);

      if (!emojis || !emojis.length) {
        this.log.error(`Failed to get guild emojis.`);
        return false;
      }

      return emojis.find((e) => e.id === emoji.id && emoji.id !== null);
    } catch (e) {
      this.log.critical(
        `Failed to broadcastEval emojis.\n${e}`,
        interaction.guildId
      );

      return null;
    }
  }
}
