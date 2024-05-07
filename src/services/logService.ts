import { WebhookClient } from 'discord.js';
import { errorEmbed } from '../../utilities/utilEmbedHelpers';

enum LogLevel {
  debug = 1,
  info,
  warning,
  error,
  critical,
}

enum Color {
  red = '\x1b[31m',
  bold_red = '\x1b[31;1m',
  green = '\x1b[32m',
  yellow = '\x1b[33m',
  purple = '\x1b[35m',
  reset = '\x1b[0m',
}

const colorMap: Record<LogLevel, string> = {
  [LogLevel.debug]: Color.purple,
  [LogLevel.info]: Color.yellow,
  [LogLevel.warning]: Color.red,
  [LogLevel.error]: Color.red,
  [LogLevel.critical]: Color.bold_red,
};

const labelMap: Record<LogLevel, string> = {
  [LogLevel.debug]: '  DEBUG ',
  [LogLevel.info]: '  INFO  ',
  [LogLevel.warning]: '  WARN  ',
  [LogLevel.error]: '  ERROR ',
  [LogLevel.critical]: '  CRITL ',
};

export class LogService {
  private readonly roleBotErrorEventsWebhook: WebhookClient;

  constructor(prefix: string) {
    this._prefix = prefix;

    if (!process.env.ERROR_WEBHOOK) {
      return;
    }
    
    this.roleBotErrorEventsWebhook = new WebhookClient({
      url: process.env.ERROR_WEBHOOK,
    });

    /**
     * Discord webhook ratelimit is 20 / minute
     * To prevent RoleBot from getting your Discord IP blocked for an hour
     * collect all errors and batch submit them every minute.
     */
    setInterval(() => {
      this.batchSendErrors();
    }, 60 * 1000);
  }

  _prefix: string;

  get prefix() {
    return `[ ${this._prefix} ]`;
  }

  private errors: string[] = [];

  private batchSendErrors() {
    const formattedErrors = this.errors.join('\n');

    if (!formattedErrors.length) {
      return;
    }

    this.roleBotErrorEventsWebhook.send({
      embeds: [errorEmbed(formattedErrors)],
    }).catch((e) =>
      console.log(`- [ LogService ] RoleBotEventsWebhook threw an error.\n${e}`),
    );
    
    // We want to clear memory and all errors we just logged.
    this.errors.length = 0;
  }

  log(level: LogLevel, content: string, guildId?: string | null) {
    const logTypeDate = `${colorMap[level]}[ ${
      labelMap[level]
    } - ${new Date().toLocaleString()} ]${Color.reset}`;

    const guildString = guildId ? `- [ guild:${guildId} ]` : '-';

    const logContent = `${guildString} ${this.prefix} ${content}`;

    // Log everything for the docker container.
    console.log(`${logTypeDate} ${logContent}`);

    // We want to batch send errors to the discord webhook.
    if (level == LogLevel.critical || level == LogLevel.error) {
      this.errors.push(logContent);
    }
  }

  error(content: string, guildId?: string | null) {
    this.log(LogLevel.error, content, guildId);
  }

  debug(content: string, guildId?: string | null) {
    this.log(LogLevel.debug, content, guildId);
  }

  info(content: string, guildId?: string | null) {
    this.log(LogLevel.info, content, guildId);
  }

  warning(content: string, guildId?: string | null) {
    this.log(LogLevel.warning, content, guildId);
  }

  critical(content: string, guildId?: string | null) {
    this.log(LogLevel.critical, content, guildId);
  }
}
