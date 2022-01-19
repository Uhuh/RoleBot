import RoleBot from '../src/bot';
import { Guild, MessageEmbed, WebhookClient } from 'discord.js';
import { Colors } from '../src/interfaces';
import { WEBHOOK_ID, WEBHOOK_TOKEN } from '../src/vars';

// Because of sharding we can't reliably get the guild channel. Also this is actually so much easier!
const webhookClient = new WebhookClient({
  id: WEBHOOK_ID,
  token: WEBHOOK_TOKEN,
});

export const guildUpdate = async (
  guild: Guild,
  type: 'Left' | 'Joined',
  client: RoleBot
) => {
  const color = type === 'Joined' ? Colors.green : Colors.red;

  const size = (
    await client.shard?.fetchClientValues('guilds.cache.size')
  )?.reduce<number>((a, b) => a + Number(b), 0);

  const embed = new MessageEmbed();

  embed
    .setColor(color)
    .setTitle(`**${type} Guild**`)
    .setThumbnail(guild.iconURL() || '')
    .setDescription(guild.name)
    .addField('Member size:', `${guild.memberCount}`, true)
    .addField('Guild ID:', `${guild.id}`, true)
    .setFooter(`Guilds I'm in: ${size}`);

  webhookClient.send({
    embeds: [embed],
  });
};
