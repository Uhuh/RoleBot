import { RolebotEventsWebhook } from '../../utilities/types/globals';
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
  prefix: string;
  constructor(_prefix: string) {
    this.prefix = _prefix;
  }

  log(level: LogLevel, content: string) {
    console.log(
      colorMap[level],
      '[',
      labelMap[level],
      ']',
      '[',
      new Date().toLocaleString(),
      `]${Color.reset}`,
      '-',
      '[',
      this.prefix,
      ']',
      ` ${content}`
    );

    if (level == LogLevel.critical || level == LogLevel.error) {
      RolebotEventsWebhook.send({
        embeds: [EmbedService.errorEmbed(content)],
      });
    }
  }

  error(content: string) {
    this.log(LogLevel.error, content);
  }

  debug(content: string) {
    this.log(LogLevel.debug, content);
  }

  info(content: string) {
    this.log(LogLevel.info, content);
  }

  warning(content: string) {
    this.log(LogLevel.warning, content);
  }

  critical(content: string) {
    this.log(LogLevel.critical, content);
  }
}
