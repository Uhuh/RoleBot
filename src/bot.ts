import * as config from './vars';
import commandHandler from '../commands/commandHandler';
import { guildUpdate } from '../events/guildUpdate';
import { SlashCommand } from '../commands/slashCommand';
import { InteractionHandler } from './services/interactionHandler';
import { LogService } from './services/logService';
import { PermissionService } from './services/permissionService';
import { ReactionHandler } from './services/reactionHandler';
import { createConnection } from 'typeorm';
import {
  Category,
  GuildConfig,
  ReactMessage,
  ReactRole,
} from './database/entities';

import * as Discord from 'discord.js-light';

export default class RoleBot extends Discord.Client {
  config: any;
  commandsRun: number;
  commands: Discord.Collection<string, SlashCommand>;

  // "Services"
  log: LogService;
  permissionService: PermissionService;
  reactHandler: ReactionHandler;

  constructor() {
    super({
      // Can't get role position data without caching the roles.
      makeCache: Discord.Options.cacheWithLimits({
        RoleManager: Infinity,
      }),
      intents: [
        Discord.Intents.FLAGS.GUILDS,
        Discord.Intents.FLAGS.GUILD_MEMBERS,
        Discord.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      ],
    });
    this.config = config;
    this.commandsRun = 0;

    this.log = new LogService(`RoleBot`);
    this.permissionService = new PermissionService(this);
    this.reactHandler = new ReactionHandler();

    this.commands = new Discord.Collection();

    this.on('ready', (): void => {
      this.log.debug(`[Started]: ${new Date()}`);
      this.log.debug(
        `RoleBot reporting for duty. Currently watching ${this.guilds.cache.size} guilds.`
      );

      // Discord will eventually drop the presence if it's not "updated" periodically.
      setInterval(() => this.updatePresence(), 10000);
    });

    this.on('shardError', (e) => {
      this.log.error(`Encounted shard error.`);
      this.log.critical(`${e}`);
    });

    this.on('interactionCreate', async (interaction) =>
      InteractionHandler.handleInteraction(interaction, this)
    );

    /**
     * Have to handle raw packets and parse out the reaction ones.
     * This is required because if the bot restarts it has no memory of old messages, especially
     * its own messages that are monitored for role management.
     */
    // this.on('raw', (r) => handle_packet(r, this));
    this.on('guildCreate', (guild) => guildUpdate(guild, 'Joined', this));
    this.on('guildDelete', (guild) => guildUpdate(guild, 'Left', this));
    // React role handling
    this.on('messageReactionAdd', (...r) => {
      this.reactHandler.handleReaction(...r, 'add');
    });
    this.on('messageReactionRemove', (...r) => {
      this.reactHandler.handleReaction(...r, 'remove');
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
          name: 'Use /help for commands!',
          type: 'LISTENING',
        },
      ],
      status: 'dnd',
    });
  };

  public start = async () => {
    /**
     * Connect to postgres with all the entities.
     * URL points to my home server.
     * SYNC_DB should only be true if on dev.
     */
    await createConnection({
      type: 'postgres',
      url: config.POSTGRES_URL,
      synchronize: config.SYNC_DB,
      entities: [ReactMessage, ReactRole, Category, GuildConfig],
    })
      .then(() => this.log.debug(`Successfully connected to postgres DB.`))
      .catch((e) => this.log.critical(`Failed to connect to postgres.\n${e}`));

    this.log.info(`Connecting to Discord with bot token.`);
    await this.login(this.config.TOKEN);
    this.log.info('Bot connected.');

    // Slash commands can only load once the bot is connected?
    commandHandler(this);
  };
}
