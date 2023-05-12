import { WebhookClient } from 'discord.js';
import { EmbedService } from './embedService';

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
  _prefix: string;
  constructor(prefix: string) {
    this._prefix = prefix;
  }

  get prefix() {
    return `[ ${this._prefix} ]`;
  }

  log(level: LogLevel, content: string, guildId?: string | null) {
    const logTypeDate = `${colorMap[level]}[ ${
      labelMap[level]
    } - ${new Date().toLocaleString()} ]${Color.reset}`;

    const guildString = guildId ? `- [ guild:${guildId} ]` : '-';

    const logContent = `${guildString} ${this.prefix} ${content}`;

    console.log(`${logTypeDate} ${logContent}`);

    if (!process.env.ERROR_WEBHOOK) return;

    const RoleBotErrorEventsWebhook = new WebhookClient({
      url: process.env.ERROR_WEBHOOK,
    });

    if (level == LogLevel.critical || level == LogLevel.error) {
      RoleBotErrorEventsWebhook.send({
        embeds: [EmbedService.errorEmbed(logContent)],
      }).catch((e) =>
        console.log(
          logTypeDate,
          `- [ LogService ] RoleBotEventsWebhook threw an error.\n\t\t\t\t\t ${e}`
        )
      );
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
