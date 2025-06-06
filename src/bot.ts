import * as config from './vars';
import { buildNewCommands, commands } from '../commands/commandHandler';
import { guildUpdate } from '../events/guildUpdate';
import { InteractionHandler } from './services/interactionHandler';
import { LogService } from './services/logService';
import { PermissionService } from './services/permissionService';
import { ReactionHandler } from './services/reactionHandler';
import { DataSource } from 'typeorm';
import { Category, GuildConfig, JoinRole, ReactMessage, ReactRole } from './database/entities';

import * as Discord from 'discord.js';
import { DELETE_JOIN_ROLE, GET_GUILD_JOIN_ROLES } from './database/queries/joinRole.query';
import { DELETE_REACT_MESSAGE_BY_ROLE_ID } from './database/queries/reactMessage.query';
import { DELETE_REACT_ROLE_BY_ROLE_ID } from './database/queries/reactRole.query';
import { SlashCommand } from '../commands/command';

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, //  Capture 100% of the transactions

  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});


export class RoleBot extends Discord.Client {
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
      // RoleBot does a lot of role "pings" for visuals, don't allow it to actually mention roles. 
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
        `RoleBot reporting for duty. Currently watching ${this.guilds.cache.size} guilds.`,
      );

      // Discord will eventually drop the presence if it's not "updated" periodically.
      setInterval(() => this.updatePresence(), 10000);
    });

    this.on('shardError', (e) => {
      this.log.error(`Encountered shard error.`);
      this.log.critical(`${e}`);
    });

    this.on('interactionCreate', async (interaction) =>
      InteractionHandler.handleInteraction(interaction, this),
    );

    this.on('guildCreate', (guild) => {
      // If the client isn't ready then spawns are still sharding.
      if (!this.isReady()) {
        return;
      }

      guildUpdate(guild, 'Joined', this).catch((e) =>
        this.log.error(`Failed to send webhook for guild join.\n${e}`),
      );
    });
    this.on('guildDelete', (guild) => {
      // If the client isn't ready then spawns are still sharding.
      if (!this.isReady()) {
        return;
      }

      guildUpdate(guild, 'Left', this).catch((e) =>
        this.log.error(`Failed to send webhook for guild leave.\n${e}`),
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
    this.on('guildMemberUpdate', async (oldMember, newMember) => {
      /**
       *  If a user goes from pending TRUE to FALSE that means the finished onboarding.
       */
      if (!oldMember.pending && !newMember.pending) {
        return;
      }

      try {
        const joinRoles = await GET_GUILD_JOIN_ROLES(newMember.guild.id);

        if (!joinRoles.length) return;

        newMember.roles.add(joinRoles.map((r) => r.roleId)).catch((e) => {
          this.log.debug(`Issue giving newMember join roles\n${e}`, newMember.guild.id);
        });
      } catch (e) {
        this.log.error(`Failed to get join roles for new newMember.\n${e}`, newMember.guild.id);
      }
    });
    this.on('guildMemberAdd', async (member) => {
      // Ignore users that are doing onboarding.
      if (member.pending) {
        return;
      }

      try {
        const joinRoles = await GET_GUILD_JOIN_ROLES(member.guild.id);

        if (!joinRoles.length) return;

        member.roles.add(joinRoles.map((r) => r.roleId)).catch((e) => {
          this.log.debug(`Issue giving member join roles\n${e}`, member.guild.id);
        });
      } catch (e) {
        this.log.error(`Failed to get join roles for new member.\n${e}`, member.guild.id);
      }
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
          role.guild.id,
        );
      }
    });
  }

  public start = async () => {
    const dataSource = new DataSource({
      type: 'postgres',
      host: config.POSTGRES_HOST,
      username: config.POSTGRES_USER,
      password: config.POSTGRES_PASSWORD,
      port: 5432,
      database: config.POSTGRES_DATABASE,
      entities: [ReactMessage, ReactRole, Category, GuildConfig, JoinRole],
      logging: ['error', 'warn'],
      synchronize: config.SYNC_DB,
      poolErrorHandler: (error) => {
        this.log.error(`DataSource pool error. Shards[${this.shard?.ids}]\n${error}`);
      },
      maxQueryExecutionTime: 1000,
    });

    await dataSource.initialize()
      .catch((error) => this.log.critical(`DataSource error on initialization.\n${error}`));

    this.log.info(`Connecting to Discord with bot token.`);
    await this.login(this.config.TOKEN);
    this.log.info('Bot connected.');

    // 741682757486510081 - New RoleBot application.
    await buildNewCommands(false, config.CLIENT_ID !== '741682757486510081');
  };

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
}
