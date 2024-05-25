import { RoleBot } from './bot';
import { ClusterClient } from 'discord-hybrid-sharding';

const botInstance = new RoleBot();

botInstance.start().catch((e) =>
  botInstance.log.error(`RoleBot has encounter an error while starting up. ${e}`),
);

export const clusterClientInstance = new ClusterClient(botInstance);