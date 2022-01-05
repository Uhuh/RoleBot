import * as Discord from 'discord.js';
import * as config from './vars';
import commandHandler from '../commands/commandHandler';
import joinRole from '../events/joinRoles';
import { guildUpdate } from '../events/guildUpdate';
import { SlashCommand } from '../commands/slashCommand';
import { InteractionHandler } from './services/interactionHandler';
import { LogService } from './services/logService';
import { PermissionService } from './services/permissionService';
import { handle_packet } from '../events/raw_packet';
import { ReactionHandler } from './services/reactionHandler';

export default class RoleBot extends Discord.Client {
  config: any;
  commandsRun: number;
  reactMessage: string[];
  commands: Discord.Collection<string, SlashCommand>;

  // "Services"
  log: LogService;
  permissionService: PermissionService;
  reactHandler: ReactionHandler;

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
    this.reactHandler = new ReactionHandler();

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
    return this.reactHandler.handleReaction(reaction, user, type);
  };

  public start = async () => {
    this.log.info(`Connecting to Discord with bot token.`);
    await this.login(this.config.TOKEN);
    this.log.info('Bot connected.');

    // Slash commands can only load once the bot is connected?
    commandHandler(this);
  };
}
