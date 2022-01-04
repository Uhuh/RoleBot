import { CommandInteraction, MessageEmbed } from 'discord.js';
import { AVATAR_URL, SUPPORT_URL, VOTE_URL } from '../../src/vars';
import { Category } from '../../utilities/types/commands';
import { COLOR } from '../../utilities/types/globals';
import { SlashCommand } from '../slashCommand';
import RoleBot from '../../src/bot';

export class InfoCommand extends SlashCommand {
  constructor(client: RoleBot) {
    super(client, 'info', `RoleBot's invite, ping, etc.`, Category.general);
  }
  execute = (interaction: CommandInteraction) => {
    const embed = new MessageEmbed();

    embed
      .setTitle('General Info')
      .setColor(COLOR.AQUA)
      .setDescription(
        `
Thanks for using RoleBot!
Server count: ${this.client.guilds.cache.size} servers.
Latency is ${
          Date.now() - interaction.createdTimestamp
        }ms. API Latency is ${Math.round(this.client.ws.ping)}ms.

[Click to Vote!](${VOTE_URL})
[Join the support server!](${SUPPORT_URL})
`
      )
      .setThumbnail(AVATAR_URL);

    interaction.reply({
      content: `Here's some info about me.`,
      embeds: [embed],
    });
  };
}
