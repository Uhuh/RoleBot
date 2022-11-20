import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { AVATAR_URL, INVITE_URL, SUPPORT_URL, VOTE_URL } from '../../src/vars';
import { Category } from '../../utilities/types/commands';
import { COLOR } from '../../utilities/types/globals';
import { SlashCommand } from '../slashCommand';
import * as i18n from 'i18n';

export class InfoCommand extends SlashCommand {
  constructor() {
    super('info', `RoleBot's invite, ping, etc.`, Category.general);
  }
  execute = async (interaction: ChatInputCommandInteraction) => {
    if (!interaction.guild) return;

    const embed = new EmbedBuilder();
    const size = (
      await interaction.client.shard?.fetchClientValues('guilds.cache.size')
    )?.reduce<number>((a, b) => a + Number(b), 0);

    embed
      .setTitle(i18n.__('GENERAL.INFO.TITLE'))
      .setColor(COLOR.AQUA)
      .setDescription(
        i18n.__('GENERAL.INFO.DESCRIPTION', {
          shardId: `${interaction.guild.shardId}`,
          size: `${size}`,
          latency: `${Date.now() - interaction.createdTimestamp}`,
          apiLatency: `${Math.round(interaction.client.ws.ping)}`,
        }) +
          `\n\n[Click to Vote!](${VOTE_URL})\n[Join the support server!](${SUPPORT_URL})\n[Click to invite!](${INVITE_URL})`
      )
      .setThumbnail(AVATAR_URL);

    interaction
      .reply({
        content: i18n.__('GENERAL.INFO.CONTENT'),
        embeds: [embed],
      })
      .catch((e) =>
        this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
      );
  };
}
