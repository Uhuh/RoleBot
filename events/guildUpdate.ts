import { Guild, MessageEmbed, TextChannel } from 'discord.js';
import RoleBot from '../src/bot';
import { Colors } from '../src/interfaces';

const ROLEBOT_GUILD_ID = '567819334852804626';
const ROLEBOT_LOG_CHANNEL_ID = '661410527309856827';

export const guildUpdate = (
  guild: Guild,
  type: 'Left' | 'Joined',
  client: RoleBot
) => {
  const rolebotGuild = client.guilds.cache.get(ROLEBOT_GUILD_ID);

  if (!rolebotGuild) return console.error(`Could not get RoleBots guild.`);

  const rolebotChannel = rolebotGuild.channels.cache.get(
    ROLEBOT_LOG_CHANNEL_ID
  );

  if (!rolebotChannel)
    return console.error(`Could not get RoleBots logging channel.`);

  if (!rolebotChannel.isText)
    return console.error(`The fetched logging channel was not a text channel.`);

  const color = type === 'Joined' ? Colors.green : Colors.red;

  const embed = new MessageEmbed();

  embed
    .setColor(color)
    .setTitle(`**${type} Guild**`)
    .setThumbnail(guild.iconURL() || '')
    .setDescription(guild.name)
    .addField('Member size:', `${guild.memberCount}`, true)
    .addField('Guild ID:', `${guild.id}`, true)
    .setFooter(`Guilds I'm in: ${client.guilds.cache.size}`);

  (rolebotChannel as TextChannel).send({ embeds: [embed] });
};
