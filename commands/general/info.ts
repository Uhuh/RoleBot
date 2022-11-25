import { ActionRowBuilder, ButtonBuilder } from '@discordjs/builders';
import {
  ButtonStyle,
  ChatInputCommandInteraction,
  Colors,
  EmbedBuilder,
} from 'discord.js';
import { AVATAR_URL, INVITE_URL, SUPPORT_URL, VOTE_URL } from '../../src/vars';
import { Category } from '../../utilities/types/commands';
import { SlashCommand } from '../slashCommand';

export class InfoCommand extends SlashCommand {
  constructor() {
    super('info', `RoleBot's invite, ping, etc.`, Category.general);
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
        .setStyle(ButtonStyle.Link)
    );
  };

  execute = async (interaction: ChatInputCommandInteraction) => {
    const embed = new EmbedBuilder();
    const [size, memberCount] = await Promise.all([
      interaction.client.shard?.fetchClientValues('guilds.cache.size'),
      interaction.client.shard?.broadcastEval((c) =>
        c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)
      ),
    ]);

    await interaction.deferReply();

    const buttons = this.buttons();
    let emoji;

    const ping = Math.floor(interaction.client.ws.ping);

    if (ping > 0) {
      emoji = ' <:rolebot__goodping:1044464966973001819>';
    }
    if (ping > 125) {
      emoji = '<:rolebot__idleping:1044466765117272094>';
    }
    if (ping > 250) {
      emoji = '<:rolebot__badping:1044466766270701619>';
    }

    embed
      .setTitle('General Info')
      .setColor(Colors.Blurple)
      .addFields(
        {
          name: '<:rolebot_people:1044464965618253895> Shard ID',
          value: `This servers shard is ${interaction.guild?.shardId}`,
        },
        {
          name: '<:rolebot_people:1044464965618253895> Server count',
          value: `RoleBot is in ${size?.reduce<number>(
            (acc, guildCount) => acc + Number(guildCount),
            0
          )} servers.`,
        },
        {
          name: '<:rolebot_people:1044464965618253895> Total Member count',
          value: `RoleBot has ${memberCount?.reduce<number>(
            (acc, memberCount) => acc + Number(memberCount),
            0
          )} current users.`,
        },
        {
          name: `${emoji} Ping`,
          value: `RoleBot's ping is ${ping}ms.`,
        }
      )

      .setThumbnail(AVATAR_URL);

    interaction
      .editReply({
        embeds: [embed],
        components: [buttons],
      })
      .catch((e) =>
        this.log.error(`Interaction failed.\n${e}`, interaction.guildId)
      );
  };
}
