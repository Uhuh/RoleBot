import * as Discord from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();
import * as config from './vars';
import commandHandler from '../commands/commandHandler';
import joinRole from '../events/joinRoles';
import { guildUpdate } from '../events/guildUpdate';
import * as mongoose from 'mongoose';
import {
  GET_ALL_JOIN_ROLES,
  GET_ALL_REACT_MESSAGES,
  GET_REACT_ROLE_BY_EMOJI,
} from './database/database';
import { SlashCommand } from '../commands/slashCommand';
import { InteractionHandler } from './services/interactionHandler';
import { LogService } from './services/logService';

export default class RoleBot extends Discord.Client {
  config: any;
  commandsRun: number;
  reactMessage: string[];
  commands: Discord.Collection<string, SlashCommand>;
  joinRoles: Discord.Collection<string, string[]>;
  reactChannel: Discord.Collection<string, Discord.Message>;
  guildPrefix: Discord.Collection<string, string>;
  log: LogService;

  constructor() {
    super({
      partials: ['REACTION'],
      intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
      ],
    });
    this.config = config;
    this.reactMessage = [];
    this.commandsRun = 0;
    this.log = new LogService(`RoleBot`);

    this.commands = new Discord.Collection();
    this.reactChannel = new Discord.Collection();
    this.joinRoles = new Discord.Collection<string, string[]>();
    this.guildPrefix = new Discord.Collection();

    this.on('ready', (): void => {
      this.log.debug(`[Started]: ${new Date()}`);
      this.log.info(
        `RoleBot reporting for duty. Currently watching ${this.guilds.cache.size} guilds.`
      );

      setInterval(() => this.updatePresence(), 10000);
    });

    this.on('interactionCreate', async (interaction) =>
      InteractionHandler.handleInteraction(interaction, this)
    );

    this.on('guildMemberAdd', (member) => joinRole(member, this.joinRoles));
    this.on('guildCreate', (guild) => guildUpdate(guild, 'Joined', this));
    this.on('guildDelete', (guild) => guildUpdate(guild, 'Left', this));
    // React role handling
    this.on('messageReactionAdd', (...r) => {
      this.handleReaction(...r, 'add');
    });
    this.on('messageReactionRemove', (...r) => {
      this.handleReaction(...r, 'remove');
    });
    /**
     * Whenever roles get deleted or changed let's update RoleBots DB.
     * Remove roles deleted and update role names.
     */
    //this.on('roleDelete', (role) => roleDelete(role, this));
    //this.on('roleUpdate', (...r) => roleUpdate(...r, this));
  }

  private updatePresence = () => {
    if (!this.user)
      return this.log.error(`Can't set presence due to client user missing.`);

    this.user.setPresence({
      activities: [
        {
          name: 'reactions...',
          type: 'WATCHING',
        },
      ],
      status: 'dnd',
    });
  };

  private handleReaction = async (
    reaction: Discord.MessageReaction | Discord.PartialMessageReaction,
    user: Discord.User | Discord.PartialUser,
    type: 'add' | 'remove'
  ) => {
    try {
      if (!reaction || user.bot) return;
      const { message, emoji } = reaction;
      const { guild } = message;
      if (this.reactMessage.includes(message.id) && guild) {
        const emojiId = emoji.id || emoji.name;

        if (!emojiId) {
          return this.log.error(`Couldn't get emoji ID from reaction event.`);
        }

        const reactRole = await GET_REACT_ROLE_BY_EMOJI(emojiId, guild.id);

        // Remove reaction since it doesn't exist.
        if (!reactRole && type === 'add') {
          return reaction.users.remove(user.id).catch(this.log.error);
        } else if (!reactRole) return;

        const role = guild.roles.cache.get(reactRole.roleId);
        let member = guild.members.cache.get(user.id);

        if (!member) {
          this.log.info(
            `Role ${type} - Failed to get member from cache. Going to fetch and retry.... guild[${guild.id}] - user[${user.id}]`
          );
          await guild.members.fetch(user.id);
          member = guild.members.cache.get(user.id);
          this.log.info(
            `Did member fectch successfully?. Does member exist: ${!!member}`
          );
        }

        if (!role) {
          return this.log.error(
            `Could not find GuildRole from stored ReactRole: roleID[${reactRole.id}]. Possibly deleted.`
          );
        } else if (!member) {
          return this.log.error(
            `Could not find GuildMember from ReactionUser: username[${user.username}] | ID[${user.id}]`
          );
        }

        switch (type) {
          case 'add':
            member.roles
              .add(role)
              .catch(() =>
                this.log.error(
                  `Error issuing role[${role.id}] to user[${member?.id}]. Perhaps a permission issue.`
                )
              );
            break;
          case 'remove':
            member.roles
              .remove(role)
              .catch(() =>
                this.log.error(
                  `Error removing role[${role.id}] from user[${member?.id}]. Perhaps a permission issue.`
                )
              );
        }
      }
    } catch (e) {
      this.log.error(
        `Error thrown when tryingg to [${type}] a reaction role to user.`
      );
    }
  };

  private async loadReactMessageIds(): Promise<void> {
    const messages = await GET_ALL_REACT_MESSAGES();
    this.reactMessage = messages.map((m) => m.messageId);
  }

  private async loadGuildJoinRoles(): Promise<void> {
    const guilds = await GET_ALL_JOIN_ROLES();

    for (const g of guilds) {
      this.joinRoles.set(g.guildId, g.joinRoles);
    }
  }

  public start = async () => {
    this.log.info(`Connecting to MONGODB: ${config.DATABASE_TYPE}`);
    await mongoose.connect(`mongodb://localhost/rolebotBeta`);

    this.log.info(`Connecting to Discord with bot token.`);
    await this.login(this.config.TOKEN);
    this.log.info('Bot connected.');

    // Slash commands can only load once the bot is connected?
    commandHandler(this);

    this.log.info(
      `Loading basic data.\n\t\t-\tGuild auto-join roles\n\t\t-\tMessage IDs`
    );
    await Promise.all([this.loadGuildJoinRoles(), this.loadReactMessageIds()]);

    this.log.info(`Successfully loaded all data and logged in.`);
  };
}
