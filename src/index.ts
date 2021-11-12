import RB from './bot';
import { LogService } from './services/logService';

const RoleBot = new RB();

RoleBot.start().catch((e) => {
  LogService.setPrefix('BotStart');
  LogService.logError(`RoleBot has encounter an error while starting up. ${e}`);
});

export default RoleBot;
