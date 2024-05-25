import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
} from 'discord.js';
import { AVATAR_URL, INVITE_URL, SUPPORT_URL, VOTE_URL } from '../../src/vars';
import { SlashCommand } from '../command';
import { clusterClientInstance } from '../../src/bot-start';

export class InfoBaseCommand extends SlashCommand {
  constructor() {
    super('info', `RoleBot's invite, ping, etc.`);
  }

  buttons = () => {
    return new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel('Invite')
        .setURL(INVITE_URL)
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setLabel('Vote')
        .setURL(VOTE_URL)
        .setStyle(ButtonStyle.Link),
      new ButtonBuilder()
        .setLabel('Support Server')
        .setURL(SUPPORT_URL)
        .setStyle(ButtonStyle.Link),
    );
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    const embed = new EmbedBuilder();
    const [size, memberCount] = await Promise.all([
      clusterClientInstance.fetchClientValues('guilds.cache.size'),
      clusterClientInstance.broadcastEval((c) =>
        c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
      ),
    ]);

    const buttons = this.buttons();

    const ping = Math.floor(interaction.client.ws.ping);

    // Assume "good" ping.
    let emoji = '🟢'
    if (ping > 125) emoji = '🟡';
    if (ping > 250) emoji = '🔴';

    embed
      .setTitle('General Info')
      .setColor(Colors.Blurple)
      .addFields(
        {
          name: '🫂 Shard ID',
          value: `This servers shard is ${interaction.guild?.shardId}`,
        },
        {
          name: '🫂 Server count',
          value: `RoleBot is in ${(size as number[]).reduce<number>((a, b) => a + Number(b), 0)} servers.`,
        },
        {
          name: '🫂 Total Member count',
          value: `RoleBot has ${memberCount?.reduce<number>(
            (acc, memberCount) => acc + Number(memberCount),
            0,
          )} current users.`,
        },
        {
          name: `${emoji} Ping`,
          value: `RoleBot's ping is ${ping}ms.`,
        },
      )
      .setThumbnail(AVATAR_URL);

    interaction
      .reply({
        embeds: [embed],
        components: [buttons],
      })
      .catch((e) =>
        this.log.error(`Interaction failed.\n${e}`, interaction.guildId),
      );
  };
}
