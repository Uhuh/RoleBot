import { ChannelType, PermissionsBitField } from 'discord.js';
import RoleBot from '../bot';
import { CLIENT_ID } from '../vars';
import { LogService } from './logService';

export enum HasPerms {
  error = 1,
  failed,
  passed,
}

export class PermissionService {
  client: RoleBot;
  log: LogService;

  constructor(_client: RoleBot) {
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
    } else if (channel.type !== ChannelType.GuildText) {
      this.log.error(
        `Channel[${channelId}] on guild[${guildId}] is not a text channel somehow.`
      );
      return HasPerms.error;
    }

    /**
     * Reason for these perms
     * @param PermissionsBitField.Flags.ADD_REACTIONS   - Have to be able to react, it is a react role bot.
     * @param PermissionsBitField.Flags.SEND_MESSAGES   - Have to be able to send embeds.
     * @param PermissionsBitField.Flags.MANAGE_MESSAGES - To update the embeds react role list.
     * @param PermissionsBitField.Flags.ManageRoles    - To update users roles.
     */
    const hasCorrectPerms = clientMember.permissions.has(
      [
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AddReactions,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ManageMessages,
        PermissionsBitField.Flags.ManageRoles,
      ],
      true
    );

    return hasCorrectPerms;
  };
}
