import { TextChannel } from 'discord.js';
import RoleBot from '../src/bot';
import { LogService } from '../src/services/logService';

const log = new LogService('RawPacket');

export const handle_packet = async (packet: any, client: RoleBot) => {
  try {
    if (
      !packet.t ||
      (packet.t !== 'MESSAGE_REACTION_ADD' &&
        packet.t !== 'MESSAGE_REACTION_REMOVE')
    ) {
      return;
    }

    const channel = await client.channels
      .fetch(packet.d.channel_id, {
        cache: false,
      })
      .catch((e) => {
        log.error(`Failed to fetch channel[${packet.d.channel_id}]`);
        log.critical(`${e}`);
      });

    if (!channel || channel.type !== 'GUILD_TEXT') {
      return;
    }
    //Ignore if messages are cached already
    if ((channel as TextChannel).messages.cache.has(packet.d.message_id)) {
      return;
    }

    const message = await (channel as TextChannel).messages.fetch(
      packet.d.message_id,
      {
        cache: false,
      }
    );

    const react = message.reactions.cache.get(
      //Emojis without a unicode name must be referenced
      packet.d.emoji.id || packet.d.emoji.name
    );
    const user = await client.users.fetch(packet.d.user_id).catch((e) => {
      log.error(`Failed to fetch user[${packet.d.user_id}]`);
      log.critical(`${e}`);
    });

    // Just... ignore react if it doesn't exist anymore????
    if (!user || user.bot || !react) {
      return; // Ignore bots. >:((((
    }

    if (packet.t === 'MESSAGE_REACTION_ADD') {
      client.emit('messageReactionAdd', react, user);
    } else if (packet.t === 'MESSAGE_REACTION_REMOVE') {
      client.emit('messageReactionRemove', react, user);
    }
  } catch (e) {
    log.error(`Issue handling packet for guild[${packet.d.guild_id}].`);
    log.critical(`${e}`);
  }
};
