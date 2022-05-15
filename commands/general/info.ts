import { CommandInteraction, MessageEmbed } from 'discord.js-light';
import { AVATAR_URL, INVITE_URL, SUPPORT_URL, VOTE_URL } from '../../src/vars';
import { Category } from '../../utilities/types/commands';
import { COLOR } from '../../utilities/types/globals';
import { SlashCommand } from '../slashCommand';
import RoleBot from '../../src/bot';

export class InfoCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(client, 'info', `RoleBot's invite, ping, etc.`, Category.general);
  }
  execute = async (interaction: CommandInteraction) => {
    const embed = new MessageEmbed();
    const size = (
      await this.client.shard?.fetchClientValues('guilds.cache.size')
    )?.reduce<number>((a, b) => a + Number(b), 0);

    embed
      .setTitle('General Info')
      .setColor(COLOR.AQUA)
      .setDescription(
        `
Thanks for using RoleBot!

Check out my site! https://rolebot.gg

This servers shard ID: ${interaction.guild?.shardId}
Server count: ${size} servers.
Latency is ${
          Date.now() - interaction.createdTimestamp
        }ms. API Latency is ${Math.round(this.client.ws.ping)}ms.

[Click to Vote!](${VOTE_URL})
[Join the support server!](${SUPPORT_URL})
[Click to invite!](${INVITE_URL})
`
      )
      .setThumbnail(AVATAR_URL);

    interaction
      .reply({
        content: `Here's some info about me.`,
        embeds: [embed],
      })
      .catch((e) => this.log.error(`Interaction failed.\n${e}`));
  };
}
