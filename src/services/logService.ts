export class LogService {
  static ANSI_RED = '\u001b[31m';
  static ANSI_GREEN = '\u001b[32m';
  static ANSI_YELLOW = '\u001b[33m';
  static ANSI_PURPLE = '\u001b[35m';
  static ANSI_RESET = '\u001b[0m';
  constructor() {}

  static logError = (content: string) =>
    console.log(`${this.ANSI_RED}[  ERROR ]${this.ANSI_RESET} - ${content}`);
  static logOk = (content: string) =>
    console.log(`${this.ANSI_GREEN}[   OK   ]${this.ANSI_RESET} - ${content}`);
  static logInfo = (content: string) =>
    console.log(`${this.ANSI_YELLOW}[  INFO  ]${this.ANSI_RESET} - ${content}`);
  static logDebug = (content: string) =>
    console.log(`${this.ANSI_PURPLE}[  DEBUG ]${this.ANSI_RESET} - ${content}`);
}
