import { Permissions } from 'discord.js-light';
import { PermissionMappings } from '../../commands/slashCommand';
import Rolebot from '../bot';
import { CLIENT_ID } from '../vars';
import { LogService } from './logService';

export enum HasPerms {
  error = 1,
  failed,
  passed,
}

export class PermissionService {
  client: Rolebot;
  log: LogService;

  constructor(_client: Rolebot) {
    this.client = _client;
    this.log = new LogService('PermissionService');
  }

  /**
   * Check if the client is able to do whole react role flow.
   * @param guildId To grab guild from clients cache.
   * @param channelId To grab channel from guild object.
   * @returns If client encounters an error or if the client does or does not have correct permissions.
   */
  canClientPrepareReactMessage = async (
    guildId: string,
    channelId: string
  ): Promise<HasPerms.error | boolean> => {
    const guild = await this.client.guilds.fetch(guildId);

    if (!guild) {
      this.log.error(
        `Client could not find guild[${guildId}] in cache. Is it not cached?`
      );
      return HasPerms.error;
    }

    const clientMember = await guild.members.fetch(CLIENT_ID);

    if (!clientMember) {
      this.log.error(`Couldn't find client member on guild[${guildId}]`);
      return HasPerms.error;
    }

    const channel = await guild.channels.fetch(channelId);

    if (!channel) {
      this.log.error(
        `Client could not find channel[${channelId}] on guild[${guildId}].`
      );
      return HasPerms.error;
    } else if (!channel.isText()) {
      this.log.error(
        `Channel[${channelId}] on guild[${guildId}] is not a text channel somehow.`
      );
      return HasPerms.error;
    }

    /**
     * Reason for these perms
     * @param Permissions.FLAGS.ADD_REACTIONS   - Have to be able to react, it is a react role bot.
     * @param Permissions.FLAGS.SEND_MESSAGES   - Have to be able to send embeds.
     * @param Permissions.FLAGS.MANAGE_MESSAGES - To update the embeds react role list.
     * @param Permissions.FLAGS.MANAGE_ROLES    - To update users roles.
     */
    const hasCorrectPerms = clientMember.permissions.has(
      [
        Permissions.FLAGS.READ_MESSAGE_HISTORY,
        Permissions.FLAGS.ADD_REACTIONS,
        Permissions.FLAGS.SEND_MESSAGES,
        Permissions.FLAGS.MANAGE_MESSAGES,
        Permissions.FLAGS.MANAGE_ROLES,
      ],
      true
    );

    return hasCorrectPerms;
  };
}
