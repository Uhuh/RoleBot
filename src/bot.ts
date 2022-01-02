import * as Discord from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();
import * as config from './vars';
import commandHandler from '../commands/commandHandler';
import joinRole from '../events/joinRoles';
import { guildUpdate } from '../events/guildUpdate';
import * as mongoose from 'mongoose';
import { GET_REACT_MSG } from './database/database';
import { SlashCommand } from '../commands/slashCommand';
import { InteractionHandler } from './services/interactionHandler';
import { LogService } from './services/logService';
import { PermissionService } from './services/permissionService';
import { handle_packet } from '../events/raw_packet';

export default class RoleBot extends Discord.Client {
  config: any;
  commandsRun: number;
  reactMessage: string[];
  commands: Discord.Collection<string, SlashCommand>;

  // "Services"
  log: LogService;
  permissionService: PermissionService;

  constructor() {
    super({
      partials: ['REACTION'],
      intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.DIRECT_MESSAGES,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      ],
    });
    this.config = config;
    this.reactMessage = [];
    this.commandsRun = 0;

    this.log = new LogService(`RoleBot`);
    this.permissionService = new PermissionService(this);

    this.commands = new Discord.Collection();

    this.on('ready', (): void => {
      this.log.debug(`[Started]: ${new Date()}`);
      this.log.info(
        `RoleBot reporting for duty. Currently watching ${this.guilds.cache.size} guilds.`
      );

      // Discord will eventually drop the presence if it's not "updated" periodically.
      setInterval(() => this.updatePresence(), 10000);
    });

    this.on('interactionCreate', async (interaction) =>
      InteractionHandler.handleInteraction(interaction, this)
    );

    /**
     * Have to handle raw packets and parse out the reaction ones.
     * This is required because if the bot restarts it has no memory of old messages, especially
     * its own messages that are monitored for role management.
     */
    this.on('raw', (r) => handle_packet(r, this));
    this.on('guildMemberAdd', (member) => joinRole(member, this));
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

      if (!guild) return;

      const emojiId = emoji.id || emoji.name;

      if (!emojiId) {
        return this.log.debug(
          `Emoji doesn't exist on message[${message.id}] reaction for guild[${guild.id}].`
        );
      }

      const reactRole = await GET_REACT_MSG(message.id, emojiId);

      if (!reactRole) return;

      const member = await guild.members
        .fetch(user.id)
        .catch(() =>
          this.log.error(`Fetching user[${user.id}] threw an error.`)
        );

      if (!member) {
        return this.log.debug(
          `Failed to fetch member with user[${user.id}] for reaction[${type}] on guild[${guild.id}]`
        );
      }

      switch (type) {
        case 'add':
          member.roles
            .add(reactRole.roleId)
            .catch(() =>
              this.log.error(
                `Cannot give role[${reactRole.roleId}] to user[${member?.id}]`
              )
            );
          break;
        case 'remove':
          member.roles
            .remove(reactRole.roleId)
            .catch(() =>
              this.log.error(
                `Cannot remove role[${reactRole.roleId}] from user[${member?.id}]`
              )
            );
      }
    } catch (e) {
      this.log.error(`[HandleReaction] threw an error on reaction[${type}]`);
      this.log.error(`${e}`);
    }
  };

  public start = async () => {
    this.log.info(`Connecting to MONGODB: ${config.DATABASE_TYPE}`);
    await mongoose.connect(`mongodb://localhost/rolebotBeta`);

    this.log.info(`Connecting to Discord with bot token.`);
    await this.login(this.config.TOKEN);
    this.log.info('Bot connected.');

    // Slash commands can only load once the bot is connected?
    commandHandler(this);
  };
}
