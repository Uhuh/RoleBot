import RB from './bot';
import { LogService } from './services/logService';

const RoleBot = new RB();
const log = new LogService(`BotStart:Index`);

RoleBot.start().catch((e) => {
  log.error(`RoleBot has encounter an error while starting up. ${e}`);
});

export default RoleBot;
