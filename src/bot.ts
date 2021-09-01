import * as Discord from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();
import * as config from './vars';
import msg from '../events/message';
import commandHandler from '../commands/commandHandler';
import joinRole from '../events/joinRoles';
import { guildUpdate } from '../events/guildUpdate';

import { handle_packet } from '../events/raw_packet';
import { IFolder, IJoinRole, IFolderReactEmoji } from './interfaces';
import { roleDelete, roleUpdate } from '../events/roleupdate';

export interface Command {
  desc: string;
  args: string;
  name: string;
  type: string;
  run: (msg: Discord.Message, args: string[], client: RoleBot) => unknown;
}

export default class RoleBot extends Discord.Client {
  config: any;
  reactMessage: string[];
  commands: Discord.Collection<string, Command>;
  commandsRun: number;
  reactChannel: Discord.Collection<string, Discord.Message>;
  guildFolders: Discord.Collection<string, IFolder[]>;
  folderContents: Discord.Collection<number, IFolderReactEmoji>;
  joinRoles: Discord.Collection<string, Partial<IJoinRole>[]>;

  constructor() {
    super({
      partials: ['REACTION'],
      intents: [],
    });
    this.config = config;
    this.commands = new Discord.Collection();
    this.reactMessage = [];
    this.commandsRun = 0;
    this.reactChannel = new Discord.Collection();
    this.guildFolders = new Discord.Collection<string, IFolder[]>();
    this.folderContents = new Discord.Collection<number, IFolderReactEmoji>();
    this.joinRoles = new Discord.Collection<string, Partial<IJoinRole>[]>();

    commandHandler(this);
    /**
     * V12 is a pain and now we have to handle all the packets ourselves since nothing is cahced.
     * Fun. The bot is about roles so I better handle add/remove
     */
    this.on('raw', (packet) => handle_packet(packet, this));

    this.on('ready', (): void => {
      console.log(`[Started]: ${new Date()}`);
      console.log(
        `RoleBot reporting for duty. Currently watching ${this.guilds.cache.size} guilds.`
      );

      setInterval(() => this.updatePresence(), 10000);
    });
    this.on('message', (message): void => msg(this, message));
    this.on('guildMemberAdd', (member) => joinRole(member, this.joinRoles));
    this.on('guildCreate', (guild): void => guildUpdate(guild, 'Joined', this));
    this.on('guildDelete', (guild): void => guildUpdate(guild, 'Left', this));
    // React role handling
    this.on('messageReactionAdd', (reaction, user) =>
      this.handleReaction(reaction, user, 'add')
    );
    this.on('messageReactionRemove', (reaction, user) =>
      this.handleReaction(reaction, user, 'remove')
    );
    /**
     * Whenever roles get deleted or changed let's update RoleBots DB.
     * Remove roles deleted and update role names.
     */
    this.on('roleDelete', (role) => roleDelete(role, this));
    this.on('roleUpdate', (oldRole, newRole) =>
      roleUpdate(oldRole, newRole, this)
    );
  }

  updatePresence = () => {
    if (!this.user)
      return console.error(`Can't set presence due to client user missing.`);

    this.user.setPresence({
      activities: [
        {
          name: 'rb help',
          type: 'WATCHING',
        },
      ],
      status: 'dnd',
    });
  };

  handleReaction = async (
    reaction: Discord.MessageReaction | Discord.PartialMessageReaction,
    user: Discord.User | Discord.PartialUser,
    type: string
  ) => {
    try {
      if (!reaction || user.bot) return;
      const { message, emoji } = reaction;
      const { guild } = message;
      if (this.reactMessage.includes(message.id) && guild) {
        const id = emoji.id || emoji.name;
        const emoji_role = getRoleByReaction(id, guild.id);
        // Remove reaction since it doesn't exist.
        if (!emoji_role && type === 'add') {
          reaction.users.remove(user.id).catch(console.error);
          return;
        } else if (!emoji_role) return;

        const { role_id } = emoji_role;

        if (!role_id) return;

        const role = guild.roles.cache.get(role_id);
        let member = guild.members.cache.get(user.id);

        if (!member) {
          console.log(
            `Role Exist: ${Boolean(
              role
            )} Role ${type} - Failed to get member from cache. Going to fetch and retry.... guild[${
              guild.id
            }] - user[${user.id}]`
          );
          await guild.members.fetch(user.id);
          member = guild.members.cache.get(user.id);
        }

        if (!role)
          throw new Error(`Role does not exist. Possibly deleted from server.`);
        if (!member)
          throw new Error(`Member not found: ${user.username} - ${user.id}`);

        switch (type) {
          case 'add':
            member.roles.add(role).catch(console.error);
            break;
          case 'remove':
            member.roles.remove(role).catch(console.error);
        }

        return;
      }

      return;
    } catch (e) {}
  };

  randomPres = (): void => {
    const user = this.user;
    if (!user) return console.log('Client dead?');

    user
      .setPresence({
        activity: { name: `rb help`, type: 'WATCHING' },
        status: 'dnd',
      })
      .catch(console.error);
  };

  /**
   * Hmm, the issue currently is being limited by Discords API
   * Need to find out how clear guilds messages by bot vs custom.
   * Maybe a new system is in place
   */
  async loadReactMessage(): Promise<void> {
    const rows = getReactMessages();

    for (const r of rows) {
      const M_ID = r.message_id;
      this.reactMessage.push(M_ID);
    }
  }

  /**
   * I might kill this role system off.
   */
  async loadRoles(): Promise<void> {
    const GUILD_IDS = this.guilds.cache.keys();

    for (const g_id of GUILD_IDS) {
      const joinRoles = getJoinRoles(g_id);

      const roles: Partial<IJoinRole>[] = joinRoles.map((r) => ({
        role_name: r.role_name,
        role_id: r.role_id,
      }));

      this.joinRoles.set(g_id, roles);
    }
  }

  async loadFolders(): Promise<void> {
    this.guilds.cache.forEach((g) => {
      const FOLDERS = guildFolders(g.id);
      if (!FOLDERS || !FOLDERS.length) return;
      this.guildFolders.set(g.id, FOLDERS);
      for (const f of FOLDERS) {
        const roles = folderContent(f.id);
        let r = roles.map((r) => ({
          role_id: r.role_id,
          role_name: r.role_name,
          emoji_id: r.emoji_id,
        }));

        if (r.length === 1 && r[0].role_id === null) r = [];

        this.folderContents.set(f.id, {
          id: f.id,
          label: f.label,
          guild_id: g.id,
          roles: r,
        });
      }
    });
  }

  async start() {
    await this.login(this.config.TOKEN);
    await this.loadRoles();
    await this.loadFolders();
    await this.loadReactMessage();
  }
}
