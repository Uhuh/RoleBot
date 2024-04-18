import RoleBot from '../src/bot';
import { Colors, EmbedBuilder, Guild, WebhookClient } from 'discord.js';
import { CREATE_GUILD_CONFIG } from '../src/database/queries/guild.query';

export const guildUpdate = async (
  guild: Guild,
  type: 'Left' | 'Joined',
  client: RoleBot,
) => {
  const color = type === 'Joined' ? Colors.Green : Colors.Red;
  try {
    if (type === 'Joined') {
      await CREATE_GUILD_CONFIG(guild.id);
    }

    if (!process.env.GUILD_WEBHOOK) {
      return;
    }

    const RoleBotGuildEventsWebhook = new WebhookClient({
      url: process.env.GUILD_WEBHOOK,
    });

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
        {
          name: 'Member size:',
          value: `[${guild.memberCount}]`,
          inline: true,
        },
        { name: 'Guild ID:', value: `[${guild.id}]`, inline: true },
      )
      .setFooter({
        text: `Guilds I'm in: ${size}`,
      });

    return RoleBotGuildEventsWebhook.send({
      embeds: [embed],
    });
  } catch (e) {
    console.error(
      `Failed to send guild update webhook\nGuild: ${JSON.stringify({
        id: guild.id,
        type,
        members: guild.memberCount,
      })}`,
    );
    console.error(`${e}`);
  }
};
