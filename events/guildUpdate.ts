import RoleBot from '../src/bot';
import { EmbedBuilder, Guild } from 'discord.js';
import { Colors } from '../src/interfaces';
import { RolebotEventsWebhook } from '../utilities/types/globals';

export const guildUpdate = async (
  guild: Guild,
  type: 'Left' | 'Joined',
  client: RoleBot
) => {
  const color = type === 'Joined' ? Colors.green : Colors.red;
  try {
    const size = (
      await client.shard?.fetchClientValues('guilds.cache.size')
    )?.reduce<number>((a, b) => a + Number(b), 0);

    const embed = new EmbedBuilder();

    embed
      .setColor(color)
      .setTitle(`**${type} Guild**`)
      .setThumbnail(guild.iconURL() || '')
      .setDescription(guild.name)
      .addFields(
        { name: 'Member size:', value: `${guild.memberCount}`, inline: true },
        { name: 'Guild ID:', value: `${guild.id}`, inline: true }
      )
      .setFooter({
        text: `Guilds I'm in: ${size}`,
      });

    RolebotEventsWebhook.send({
      embeds: [embed],
    });
  } catch (e) {
    console.error(`Failed to send guild update webhook`);
    console.error(`${e}`);
  }
};
