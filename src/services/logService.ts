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
  [LogLevel.warning]: Color.yellow,
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
  static prefix = '[General]';
  constructor() {}

  /**
   * Set a prefix to debug which method the Log is from.
   * @param prefix : Method that the log is currently in;
   * @returns Nothing
   */
  static setPrefix = (prefix: string) => (this.prefix = `[${prefix}]`);

  static log(level: LogLevel, content: string, ...args: any[]) {
    console.log(
      colorMap[level],
      '[',
      labelMap[level],
      ']',
      Color.reset,
      ' - ',
      this.prefix,
      ` ${content}`
    );
  }

  static error(content: string) {
    this.log(LogLevel.error, content);
  }

  static debug(content: string) {
    this.log(LogLevel.debug, content);
  }

  static info(content: string) {
    this.log(LogLevel.info, content);
  }

  static warning(content: string) {
    this.log(LogLevel.warning, content);
  }

  static critical(content: string) {
    this.log(LogLevel.critical, content);
  }
}
