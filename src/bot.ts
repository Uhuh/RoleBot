import * as config from './vars';
import { buildNewCommands, commands } from '../commands/commandHandler';
import { guildUpdate } from '../events/guildUpdate';
import { InteractionHandler } from './services/interactionHandler';
import { LogService } from './services/logService';
import { PermissionService } from './services/permissionService';
import { ReactionHandler } from './services/reactionHandler';
import { createConnection } from 'typeorm';
import {
  Category,
  GuildConfig,
  JoinRole,
  ReactMessage,
  ReactRole,
} from './database/entities';

import * as Discord from 'discord.js';
import {
  DELETE_JOIN_ROLE,
  GET_GUILD_JOIN_ROLES,
} from './database/queries/joinRole.query';
import { DELETE_REACT_MESSAGE_BY_ROLE_ID } from './database/queries/reactMessage.query';
import { DELETE_REACT_ROLE_BY_ROLE_ID } from './database/queries/reactRole.query';
import { SlashCommand } from '../commands/command';

export default class RoleBot extends Discord.Client {
  config: typeof config;
  commands: Discord.Collection<string, SlashCommand>;

  // "Services"
  log: LogService;
  permissionService: PermissionService;
  reactHandler: ReactionHandler;

  constructor() {
    super({
      intents: [
        Discord.IntentsBitField.Flags.Guilds,
        Discord.IntentsBitField.Flags.GuildMembers,
        Discord.IntentsBitField.Flags.GuildMessageReactions,
      ],
      partials: [
        Discord.Partials.Message,
        Discord.Partials.Channel,
        Discord.Partials.Reaction,
      ],
      allowedMentions: { parse: [] },
    });
    this.config = config;
    this.commands = commands();

    this.log = new LogService('RoleBot');
    this.permissionService = new PermissionService(this);
    this.reactHandler = new ReactionHandler();

    this.on('ready', (): void => {
      this.log.debug(`[Started]: ${new Date()}`);
      this.log.debug(
        `RoleBot reporting for duty. Currently watching ${this.guilds.cache.size} guilds.`
      );

      // Discord will eventually drop the presence if it's not "updated" periodically.
      setInterval(() => this.updatePresence(), 10000);
    });

    this.on('shardError', (e) => {
      this.log.error(`Encountered shard error.`);
      this.log.critical(`${e}`);
    });

    this.on('interactionCreate', async (interaction) =>
      InteractionHandler.handleInteraction(interaction, this)
    );

    this.on('guildCreate', (guild) => {
      guildUpdate(guild, 'Joined', this).catch((e) =>
        this.log.error(`Failed to send webhook for guild join.\n${e}`)
      );
    });
    this.on('guildDelete', (guild) => {
      guildUpdate(guild, 'Left', this).catch((e) =>
        this.log.error(`Failed to send webhook for guild leave.\n${e}`)
      );
    });
    // React role handling
    this.on('messageReactionAdd', (...r) => {
      this.reactHandler
        .handleReaction(...r, 'add')
        .catch((e) => this.log.error(e));
    });
    this.on('messageReactionRemove', (...r) => {
      this.reactHandler
        .handleReaction(...r, 'remove')
        .catch((e) => this.log.error(e));
    });
    this.on('guildMemberAdd', async (member) => {
      const joinRoles = await GET_GUILD_JOIN_ROLES(member.guild.id);

      if (!joinRoles.length) return;

      member.roles.add(joinRoles.map((r) => r.roleId)).catch((e) => {
        this.log.debug(`Issue giving member join roles\n${e}`);
      });
    });
    // To help try and prevent unknown role errors
    this.on('roleDelete', async (role) => {
      try {
        await DELETE_JOIN_ROLE(role.id);
        await DELETE_REACT_MESSAGE_BY_ROLE_ID(role.id);
        await DELETE_REACT_ROLE_BY_ROLE_ID(role.id);
      } catch (e) {
        this.log.error(
          `Failed to delete react role info on role[${role.id}] delete.\n${e}`,
          role.guild.id
        );
      }
    });
  }

  private updatePresence = () => {
    if (!this.user)
      return this.log.error(`Can't set presence due to client user missing.`);

    this.user.setPresence({
      activities: [
        {
          name: 'Use /help for commands!',
          type: Discord.ActivityType.Listening,
        },
        {
          name: 'Check out rolebot.gg!',
          type: Discord.ActivityType.Streaming,
        },
        {
          name: 'I use slash commands!',
          type: Discord.ActivityType.Watching,
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
      entities: [ReactMessage, ReactRole, Category, GuildConfig, JoinRole],
    })
      .then(() => this.log.debug(`Successfully connected to postgres DB.`))
      .catch((e) => this.log.critical(`Failed to connect to postgres\n${e}`));

    this.log.info(`Connecting to Discord with bot token.`);
    await this.login(this.config.TOKEN);
    this.log.info('Bot connected.');

    // 741682757486510081 - New RoleBot application.
    await buildNewCommands(true, config.CLIENT_ID !== '741682757486510081');
  };
}
