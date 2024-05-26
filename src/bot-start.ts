import { RoleBot } from './bot';

const botInstance = new RoleBot();

botInstance.start().catch((e) =>
  botInstance.log.error(`RoleBot has encounter an error while starting up. ${e}`),
);
